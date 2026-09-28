import { test, expect } from "@playwright/test";
import { signInWithGoogleAndOnboard, type TestOwner } from "../helpers/auth";
import { deleteUserById, E2E_BASE_URL, testDb } from "../helpers/db";

/**
 * Guest (unauthenticated visitor) vs Google-authenticated owner.
 * A guest only uses the public QR/visitor-token flow and never gets an account.
 */
const ORIGIN = { Origin: new URL(E2E_BASE_URL).origin };

test.describe("guest vs Google owner access", () => {
  let ownerA: TestOwner | undefined;
  let ownerB: TestOwner | undefined;

  test.afterEach(async () => {
    await deleteUserById(ownerA?.userId);
    await deleteUserById(ownerB?.userId);
    ownerA = ownerB = undefined;
  });

  test("guest can use the public visitor flow but no owner feature", async ({ page, browser }) => {
    ownerA = await signInWithGoogleAndOnboard(page, { name: "Owner A", vehicleName: "Guest Target" });
    const vehicle = await testDb.vehicle.findFirstOrThrow({ where: { ownerId: ownerA.userId } });

    const guestCtx = await browser.newContext();
    const guest = await guestCtx.newPage();
    const usersBefore = await testDb.user.count();

    // Public visitor page + sending a message.
    const pageRes = await guest.goto(`/v/${vehicle.publicToken}`);
    expect(pageRes?.status()).toBe(200);
    const send = await guestCtx.request.post("/api/public/messages", {
      headers: ORIGIN,
      data: { publicToken: vehicle.publicToken, reason: "LIGHTS_ON", body: "Your lights are on" },
    });
    expect(send.status()).toBe(201);
    const { visitorToken } = await send.json();
    expect((await guestCtx.request.get(`/api/public/conversations/${visitorToken}`)).status()).toBe(200);
    // Messaging never creates an account for the guest.
    expect(await testDb.user.count()).toBe(usersBefore);

    // Owner-only pages redirect to login.
    for (const path of ["/dashboard", "/dashboard/vehicles/new", "/dashboard/messages", "/dashboard/settings", "/onboarding"]) {
      await guest.goto(path);
      await expect(guest, path).toHaveURL(/\/login/);
    }

    // Owner-only APIs refuse: no vehicle creation, no QR generation/regeneration, no conversations.
    const api = guestCtx.request;
    expect((await api.post("/api/vehicles", { headers: ORIGIN, data: { name: "Guest car" } })).status()).toBe(401);
    expect((await api.get("/api/vehicles")).status()).toBe(401);
    expect((await api.get(`/api/vehicles/${vehicle.id}/qr.png`)).status()).toBe(401);
    expect((await api.get(`/api/vehicles/${vehicle.id}/sticker-asset`)).status()).toBe(401);
    expect((await api.patch(`/api/vehicles/${vehicle.id}`, { headers: ORIGIN, data: { regenerateToken: true } })).status()).toBe(401);
    expect((await api.get("/api/messages")).status()).toBe(401);
    expect(await testDb.vehicle.count({ where: { name: "Guest car" } })).toBe(0);
    await guestCtx.close();
  });

  test("Google owner can create vehicles and QR codes, and only sees their own resources", async ({ page, browser }) => {
    ownerA = await signInWithGoogleAndOnboard(page, { name: "Owner A", vehicleName: "Car A" });
    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    ownerB = await signInWithGoogleAndOnboard(pageB, { name: "Owner B", vehicleName: "Car B" });

    // Dashboard + vehicle creation + QR generation.
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
    const created = await page.request.post("/api/vehicles", { headers: ORIGIN, data: { name: "Second Car" } });
    expect(created.status()).toBe(201);
    const second = (await created.json()).vehicle as { id: string; publicToken: string };
    const qr = await page.request.get(`/api/vehicles/${second.id}/qr.png`);
    expect(qr.status()).toBe(200);
    expect(qr.headers()["content-type"]).toContain("image/png");

    // Own conversations are visible.
    const conv = await page.request.post("/api/public/messages", {
      headers: ORIGIN,
      data: { publicToken: second.publicToken, reason: "LIGHTS_ON", body: "hello A" },
    });
    expect(conv.status()).toBe(201);
    const listA = (await (await page.request.get("/api/messages")).json()).conversations as { id: string }[];
    expect(listA.length).toBe(1);

    // B's resources are invisible to A.
    const vB = await testDb.vehicle.findFirstOrThrow({ where: { ownerId: ownerB.userId } });
    const convB = await pageB.request.post("/api/public/messages", {
      headers: ORIGIN,
      data: { publicToken: vB.publicToken, reason: "LIGHTS_ON", body: "hello B" },
    });
    expect(convB.status()).toBe(201);
    const convBRow = await testDb.conversation.findFirstOrThrow({ where: { vehicleId: vB.id } });

    expect((await page.request.get(`/api/vehicles/${vB.id}`)).status()).toBe(404);
    expect((await page.request.get(`/api/vehicles/${vB.id}/qr.png`)).status()).toBe(404);
    expect((await page.request.patch(`/api/vehicles/${vB.id}`, { headers: ORIGIN, data: { name: "stolen" } })).status()).toBe(404);
    expect((await page.request.delete(`/api/vehicles/${vB.id}`, { headers: ORIGIN })).status()).toBe(404);
    expect((await page.request.get(`/api/conversations/${convBRow.id}`)).status()).toBe(404);
    // The thread page streams behind messages/loading.tsx, so the HTTP status is
    // committed (200) before notFound() runs — assert what actually renders.
    await page.goto(`/dashboard/messages/${convBRow.id}`);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("hello B");
    expect((await (await page.request.get("/api/vehicles")).json()).vehicles.map((v: { id: string }) => v.id)).not.toContain(vB.id);
    expect(await testDb.vehicle.count({ where: { id: vB.id, name: "Car B" } })).toBe(1);
    await ctxB.close();
  });
});
