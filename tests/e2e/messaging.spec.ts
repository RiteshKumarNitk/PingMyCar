import { test, expect } from "@playwright/test";
import { uniquePhone, signUpAndOnboard } from "../helpers/auth";
import { deleteUserByPhone, testDb } from "../helpers/db";

test.describe("messaging", () => {
  let phone: string;
  let publicToken: string;

  test.beforeEach(async ({ page }) => {
    phone = uniquePhone();
    await signUpAndOnboard(page, { phone, name: "Owner Tester", vehicleName: "Honda City" });
    const vehicle = await testDb.vehicle.findFirst({ where: { owner: { phoneNumber: phone } } });
    publicToken = vehicle!.publicToken;
  });

  test.afterEach(async () => {
    await deleteUserByPhone(phone);
  });

  test("visitor messages the vehicle, owner sees and replies, visitor sees the reply", async ({ page, browser }) => {
    // `page` here is the owner's context, already signed in via beforeEach.
    const visitorContext = await browser.newContext();
    const visitorPage = await visitorContext.newPage();

    await visitorPage.goto(`/v/${publicToken}`);
    await visitorPage.click('button:has-text("Lights are on")');
    await visitorPage.fill("textarea", "Your headlights are on!");
    await Promise.all([
      visitorPage.waitForResponse((r) => r.url().includes("/api/public/messages") && r.request().method() === "POST"),
      visitorPage.click('button:has-text("Send message")'),
    ]);
    await visitorPage.waitForURL(/\/c\/[A-Za-z0-9_-]+$/);
    const visitorToken = visitorPage.url().split("/").pop()!;

    await page.goto("/dashboard/messages");
    await expect(page.locator("body")).toContainText("Your headlights are on!");
    await page.click('a:has-text("Lights are on")');
    await page.waitForURL(/\/dashboard\/messages\/[a-f0-9-]+$/);

    await page.fill("textarea", "Thanks, on my way!");
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/conversations/") && r.request().method() === "POST"),
      page.click('button:has-text("Reply")'),
    ]);

    await visitorPage.goto(`/c/${visitorToken}`);
    await expect(visitorPage.locator("body")).toContainText("Thanks, on my way!");

    await visitorContext.close();
  });

  test("unknown tokens 404 generically on both public routes", async ({ page }) => {
    const vRes = await page.goto("/v/TOTALLYBOGUS1");
    expect(vRes?.status()).toBe(404);
    const cRes = await page.goto("/c/totally-bogus-visitor-token");
    expect(cRes?.status()).toBe(404);
  });

  test("deactivating the QR shows the inactive state, but an existing thread stays reachable", async ({
    page,
    browser,
  }) => {
    const visitorContext = await browser.newContext();
    const visitorPage = await visitorContext.newPage();

    await visitorPage.goto(`/v/${publicToken}`);
    await visitorPage.click('button:has-text("Lights are on")');
    await visitorPage.fill("textarea", "Test message");
    await Promise.all([
      visitorPage.waitForResponse((r) => r.url().includes("/api/public/messages")),
      visitorPage.click('button:has-text("Send message")'),
    ]);
    await visitorPage.waitForURL(/\/c\/[A-Za-z0-9_-]+$/);
    const visitorToken = visitorPage.url().split("/").pop()!;

    await page.goto("/dashboard/vehicles");
    await page.getByRole("link", { name: /Honda City/ }).click();
    await page.click('a:has-text("Open QR Page")');
    await page.click('button:has-text("Deactivate QR")');
    await page.getByRole("dialog").locator('button:has-text("Deactivate")').click();
    // The badge now renders from refreshed server state, so seeing "Activate
    // QR" means the PATCH has committed — no DB poll needed.
    await page.waitForSelector('button:has-text("Activate QR")');
    await expect(page.locator("text=Inactive")).toBeVisible();

    const resp = await visitorPage.goto(`/v/${publicToken}`);
    expect(resp?.status()).toBe(200);
    await expect(visitorPage.locator("body")).toContainText("no longer active");

    await visitorPage.goto(`/c/${visitorToken}`);
    await expect(visitorPage.locator("textarea")).toBeVisible();

    await visitorContext.close();
  });

  test("visitor can report a conversation, owner can block it, closing it for both sides", async ({
    page,
    browser,
  }) => {
    const visitorContext = await browser.newContext();
    const visitorPage = await visitorContext.newPage();

    await visitorPage.goto(`/v/${publicToken}`);
    await visitorPage.click('button:has-text("Lights are on")');
    await visitorPage.fill("textarea", "Test message");
    await Promise.all([
      visitorPage.waitForResponse((r) => r.url().includes("/api/public/messages")),
      visitorPage.click('button:has-text("Send message")'),
    ]);
    await visitorPage.waitForURL(/\/c\/[A-Za-z0-9_-]+$/);
    const visitorToken = visitorPage.url().split("/").pop()!;

    await visitorPage.click('button:has-text("Report it")');
    await Promise.all([
      visitorPage.waitForResponse((r) => r.url().includes("/report")),
      visitorPage.click('button:has-text("Submit report")'),
    ]);
    await expect(visitorPage.locator("text=Reported. Thank you")).toBeVisible();

    const conversation = await testDb.conversation.findFirst({ where: { vehicle: { publicToken } } });
    const reportCount = await testDb.report.count({ where: { conversationId: conversation!.id } });
    expect(reportCount).toBe(1);

    await page.goto(`/dashboard/messages/${conversation!.id}`);
    await page.click('button:has-text("Block this conversation")');
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/block")),
      page.click('button:has-text("Yes, block")'),
    ]);
    await page.reload();
    await expect(page.locator("body")).toContainText("blocked");

    const replyAfterBlock = await visitorPage.request.post(`/api/public/conversations/${visitorToken}`, {
      data: { body: "trying to reply after block" },
    });
    expect(replyAfterBlock.status()).toBe(400);

    await visitorContext.close();
  });
});
