/**
 * Conversation privacy & authorization — end-to-end against a real app + DB.
 *
 * Setup (never production) — see playwright.config.ts:
 *   E2E_DATABASE_URL=<localhost postgres> playwright test --config=playwright.integration.config.ts
 *
 * Every actor is a Google-authenticated user created via the test-session
 * helper (tests/helpers/auth.ts); admin roles are then set in the test DB.
 */
import { test, expect, type APIRequestContext, type Browser, type BrowserContext } from "@playwright/test";
import { signInAsGoogleUser } from "../helpers/auth";
import { E2E_BASE_URL, isLocalDatabaseUrl, E2E_DATABASE_URL, testDb as prisma } from "../helpers/db";

test.skip(!isLocalDatabaseUrl(E2E_DATABASE_URL), "Set E2E_DATABASE_URL to a localhost database (refusing to touch any other DB).");

const ORIGIN = E2E_BASE_URL;
const run = Date.now().toString(36);

type Actor = { ctx: BrowserContext; req: APIRequestContext; userId: string; email: string };

async function signUp(browser: Browser, label: string): Promise<Actor> {
  const ctx = await browser.newContext({ baseURL: ORIGIN });
  const { userId, email } = await signInAsGoogleUser(ctx, { name: `${label} ${run}` });
  return { ctx, req: ctx.request, userId, email };
}

async function createVehicle(owner: Actor, name: string): Promise<string> {
  const res = await owner.req.post("/api/vehicles", { headers: { Origin: ORIGIN }, data: { name } });
  expect(res.status()).toBe(201);
  return (await res.json()).vehicle.publicToken as string;
}

async function visitorMessage(req: APIRequestContext, publicToken: string, body: string) {
  const res = await req.post("/api/public/messages", {
    headers: { Origin: ORIGIN },
    data: { publicToken, reason: "LIGHTS_ON", body },
  });
  expect(res.status(), await res.text()).toBe(201);
  const { visitorToken } = (await res.json()) as { visitorToken: string };
  const conv = await prisma.conversation.findFirstOrThrow({
    where: { vehicle: { publicToken } },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  return { visitorToken, conversationId: conv.id };
}

let ownerA: Actor, ownerB: Actor, support: Actor, moderator: Actor, admin: Actor;
let convA: { visitorToken: string; conversationId: string };
let convB: { visitorToken: string; conversationId: string };
const SECRET_A = `secret-body-A-${run}`;
const SECRET_B = `secret-body-B-${run}`;

test.describe.serial("conversation privacy & authorization", () => {
  test.beforeAll(async ({ browser, playwright }) => {
    ownerA = await signUp(browser, "ownera");
    ownerB = await signUp(browser, "ownerb");
    support = await signUp(browser, "support");
    moderator = await signUp(browser, "moderator");
    admin = await signUp(browser, "admin");
    await prisma.user.update({ where: { id: support.userId }, data: { adminRole: "SUPPORT" } });
    await prisma.user.update({ where: { id: moderator.userId }, data: { adminRole: "MODERATOR" } });
    await prisma.user.update({ where: { id: admin.userId }, data: { adminRole: "ADMIN" } });

    const tokenA = await createVehicle(ownerA, "Car A");
    const tokenB = await createVehicle(ownerB, "Car B");
    const visitor = await playwright.request.newContext({ baseURL: ORIGIN });
    convA = await visitorMessage(visitor, tokenA, SECRET_A);
    convB = await visitorMessage(visitor, tokenB, SECRET_B);
  });

  test.afterAll(async () => {
    for (const a of [ownerA, ownerB, support, moderator, admin]) await a?.ctx.close();
    await prisma.$disconnect();
  });

  test("1. Owner A cannot access Owner B's conversation (IDOR)", async () => {
    const list = await (await ownerA.req.get("/api/messages")).json();
    const ids = list.conversations.map((c: { id: string }) => c.id);
    expect(ids).toContain(convA.conversationId);
    expect(ids).not.toContain(convB.conversationId);

    const foreign = `/api/conversations/${convB.conversationId}`;
    expect((await ownerA.req.get(foreign)).status()).toBe(404);
    expect((await ownerA.req.post(`${foreign}/reply`, { headers: { Origin: ORIGIN }, data: { body: "x" } })).status()).toBe(404);
    expect((await ownerA.req.patch(`${foreign}/read`, { headers: { Origin: ORIGIN } })).status()).toBe(404);
    expect((await ownerA.req.post(`${foreign}/block`, { headers: { Origin: ORIGIN } })).status()).toBe(404);
    expect((await ownerA.req.delete(foreign, { headers: { Origin: ORIGIN } })).status()).toBe(404);
    // Filtering by a foreign vehicle id yields nothing, not B's data.
    const vB = await prisma.vehicle.findFirstOrThrow({ where: { ownerId: ownerB.userId }, select: { id: true } });
    expect((await (await ownerA.req.get(`/api/messages?vehicle=${vB.id}`)).json()).conversations).toEqual([]);
    // B's conversation is untouched.
    expect(await prisma.conversation.count({ where: { id: convB.conversationId, status: "OPEN" } })).toBe(1);
  });

  test("2. Visitor token only opens its own conversation; no owner data exposed", async ({ playwright }) => {
    const visitor = await playwright.request.newContext({ baseURL: ORIGIN });
    const own = await (await visitor.get(`/api/public/conversations/${convA.visitorToken}`)).json();
    expect(Object.keys(own).sort()).toEqual(["messages", "status", "vehicleName"]);
    expect(own.messages.map((m: { body: string }) => m.body)).toEqual([SECRET_A]);
    expect(JSON.stringify(own)).not.toContain(SECRET_B);
    for (const m of own.messages) expect(Object.keys(m).sort()).toEqual(["body", "createdAt", "senderType"]);
    const raw = JSON.stringify(own);
    expect(raw).not.toContain(ownerA.email);
    expect(raw).not.toContain(ownerA.userId);
    expect(raw).not.toContain(convA.conversationId);

    expect((await visitor.get(`/api/public/conversations/not-a-real-token-${run}`)).status()).toBe(404);
    // The internal conversation id is not a visitor credential.
    expect((await visitor.get(`/api/public/conversations/${convA.conversationId}`)).status()).toBe(404);
  });

  test("3. SUPPORT (metadata only) cannot view message content — UI or server action", async ({ browser }) => {
    const page = await support.ctx.newPage();
    await page.goto(`/admin/messages/${convA.conversationId}`);
    await expect(page.getByText("Your role can see conversation metadata only")).toBeVisible();
    await expect(page.getByRole("button", { name: "Reveal content" })).toHaveCount(0);
    expect(await page.content()).not.toContain(SECRET_A);

    // Server-side guard: replay the moderator's real server-action request with SUPPORT's session.
    const modPage = await moderator.ctx.newPage();
    await modPage.goto(`/admin/messages/${convA.conversationId}`);
    await modPage.getByLabel("Reason (required)").first().fill("capture action id");
    const [actionReq] = await Promise.all([
      modPage.waitForRequest((r) => r.method() === "POST" && Boolean(r.headers()["next-action"])),
      modPage.getByRole("button", { name: "Reveal content" }).click(),
    ]);
    await expect(modPage.getByText(SECRET_A)).toBeVisible();
    const replay = await support.req.post(actionReq.url(), {
      headers: {
        "Next-Action": actionReq.headers()["next-action"],
        "Content-Type": actionReq.headers()["content-type"] ?? "text/plain;charset=UTF-8",
        Accept: "text/x-component",
        Origin: ORIGIN,
      },
      data: actionReq.postData() ?? "",
    });
    const replayText = await replay.text();
    expect(replayText).toContain("Forbidden");
    expect(replayText).not.toContain(SECRET_A);
    void browser;
  });

  test("4+5. MODERATOR can view content, and the view is audited without content", async () => {
    const before = await prisma.auditLog.count({
      where: { action: "ADMIN_VIEWED_MESSAGE_CONTENT", actorId: moderator.userId, resourceId: convA.conversationId },
    });
    const page = await moderator.ctx.newPage();
    await page.goto(`/admin/messages/${convA.conversationId}`);
    await page.getByLabel("Reason (required)").first().fill("support ticket #42");
    await page.getByRole("button", { name: "Reveal content" }).click();
    await expect(page.getByText(SECRET_A)).toBeVisible();

    const rows = await prisma.auditLog.findMany({
      where: { action: "ADMIN_VIEWED_MESSAGE_CONTENT", actorId: moderator.userId, resourceId: convA.conversationId },
      orderBy: { createdAt: "desc" },
    });
    expect(rows.length).toBe(before + 1);
    expect(rows[0].reason).toBe("support ticket #42");
    expect(rows[0].resourceType).toBe("CONVERSATION");
    expect(JSON.stringify(rows)).not.toContain(SECRET_A);
  });

  test("admin moderation (block) is enforced and audited", async ({ playwright }) => {
    const page = await admin.ctx.newPage();
    await page.goto(`/admin/messages/${convA.conversationId}`);
    await page.getByText("Block conversation", { exact: true }).click();
    await page.locator("#reason-Block-conversation").fill("abusive visitor");
    await page.getByRole("button", { name: "Block", exact: true }).click();
    await expect.poll(async () =>
      (await prisma.conversation.findUniqueOrThrow({ where: { id: convA.conversationId } })).status
    ).toBe("BLOCKED");

    const visitor = await playwright.request.newContext({ baseURL: ORIGIN });
    const reply = await visitor.post(`/api/public/conversations/${convA.visitorToken}`, {
      headers: { Origin: ORIGIN },
      data: { body: "still here?" },
    });
    expect(reply.status()).toBe(400);

    const audit = await prisma.auditLog.findFirst({
      where: { action: "ADMIN_MODERATED_CONVERSATION", actorId: admin.userId, resourceId: convA.conversationId },
    });
    expect(audit?.metadata).toMatchObject({ fromStatus: "OPEN", toStatus: "BLOCKED" });
  });

  test("6+8. Admin deletes a conversation; it's gone for owner, visitor and admin", async ({ playwright }) => {
    // SUPPORT has no CONVERSATION_DELETE → no control rendered.
    const supportPage = await support.ctx.newPage();
    await supportPage.goto(`/admin/messages/${convB.conversationId}`);
    await expect(supportPage.getByText("Delete conversation", { exact: true })).toHaveCount(0);

    const page = await admin.ctx.newPage();
    await page.goto(`/admin/messages/${convB.conversationId}`);
    await page.getByText("Delete conversation", { exact: true }).click();
    await page.locator("#reason-Delete-conversation").fill("owner privacy request");
    await page.getByRole("button", { name: "Delete permanently" }).click();
    await page.waitForURL("**/admin/messages");

    expect(await prisma.conversation.count({ where: { id: convB.conversationId } })).toBe(0);
    expect(await prisma.message.count({ where: { conversationId: convB.conversationId } })).toBe(0);
    const audit = await prisma.auditLog.findFirstOrThrow({
      where: { action: "ADMIN_DELETED_CONVERSATION", actorId: admin.userId, resourceId: convB.conversationId },
    });
    expect(audit.metadata).toMatchObject({ count: 1 });
    expect(JSON.stringify(audit)).not.toContain(SECRET_B);

    const visitor = await playwright.request.newContext({ baseURL: ORIGIN });
    expect((await ownerB.req.get(`/api/conversations/${convB.conversationId}`)).status()).toBe(404);
    expect((await visitor.get(`/api/public/conversations/${convB.visitorToken}`)).status()).toBe(404);
    const adminView = await admin.req.get(`/admin/messages/${convB.conversationId}`);
    expect(adminView.status()).toBe(404);
  });

  test("7+8. Owner deletes own conversation (blocked while a report is open)", async ({ playwright }) => {
    const visitor = await playwright.request.newContext({ baseURL: ORIGIN });
    const report = await visitor.post(`/api/public/conversations/${convA.visitorToken}/report`, {
      headers: { Origin: ORIGIN },
      data: { reason: "integration test report" },
    });
    expect(report.status()).toBe(201);

    const path = `/api/conversations/${convA.conversationId}`;
    expect((await ownerA.req.delete(path, { headers: { Origin: ORIGIN } })).status()).toBe(409);

    await prisma.report.updateMany({ where: { conversationId: convA.conversationId }, data: { status: "RESOLVED" } });
    expect((await ownerA.req.delete(path, { headers: { Origin: ORIGIN } })).status()).toBe(200);

    expect(await prisma.conversation.count({ where: { id: convA.conversationId } })).toBe(0);
    expect((await ownerA.req.get(path)).status()).toBe(404);
    expect((await visitor.get(`/api/public/conversations/${convA.visitorToken}`)).status()).toBe(404);
    expect((await moderator.req.get(`/admin/messages/${convA.conversationId}`)).status()).toBe(404);
    const audit = await prisma.auditLog.findFirstOrThrow({
      where: { action: "CONVERSATION_DELETED_BY_OWNER", actorId: ownerA.userId, resourceId: convA.conversationId },
    });
    expect(JSON.stringify(audit)).not.toContain(SECRET_A);
  });

  test("9. No cron endpoint exists; conversations work without it", async ({ playwright }) => {
    const anon = await playwright.request.newContext({ baseURL: ORIGIN });
    expect((await anon.get("/api/cron/purge-conversations")).status()).toBe(404);
  });
});
