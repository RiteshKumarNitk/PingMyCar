import { test, expect } from "@playwright/test";
import { uniquePhone, signUpAndOnboard } from "../helpers/auth";
import { deleteUserByPhone } from "../helpers/db";

test.describe("vehicles", () => {
  let phone: string;

  test.beforeEach(async ({ page }) => {
    phone = uniquePhone();
    await signUpAndOnboard(page, { phone, name: "Vehicle Tester", vehicleName: "Honda City" });
  });

  test.afterEach(async () => {
    await deleteUserByPhone(phone);
  });

  test("editing vehicle details persists across a reload", async ({ page }) => {
    await page.goto("/dashboard/vehicles");
    await page.getByRole("link", { name: /Honda City/ }).click();
    await page.fill("#name", "Honda City VX");
    await page.selectOption("#type", "CAR");
    await page.fill("#registrationNumber", "RJ14XX0000");
    // Editing keeps the same URL, so waitForURL would resolve instantly
    // without actually waiting for the PATCH — wait for the response instead.
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/vehicles/") && r.request().method() === "PATCH"),
      page.click('button:has-text("Save changes")'),
    ]);
    await page.reload();
    await expect(page.locator("#name")).toHaveValue("Honda City VX");
    await expect(page.locator("#registrationNumber")).toHaveValue("RJ14XX0000");
  });

  test("contact profile toggles update the live preview instantly, then persist on save", async ({ page }) => {
    await page.goto("/dashboard/vehicles");
    await page.getByRole("link", { name: /Honda City/ }).click();
    await page.click('a:has-text("Edit contact profile")');

    const previewCard = () => page.getByText("What visitors see", { exact: true }).locator("..");
    const toggleFor = (label: string) =>
      page.getByText(label, { exact: true }).locator("../..").locator("input[type=checkbox]");

    await expect(previewCard()).toContainText("Vehicle issue");
    await toggleFor("Vehicle issues").click();
    await expect(previewCard()).not.toContainText("Vehicle issue");

    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/profile") && r.request().method() === "PATCH"),
      page.click('button:has-text("Save changes")'),
    ]);
    await page.reload();
    await expect(toggleFor("Vehicle issues")).not.toBeChecked();
  });

  test("QR code deactivates, reactivates, and regenerates to a new URL (on the QR page)", async ({ page }) => {
    await page.goto("/dashboard/vehicles");
    await page.getByRole("link", { name: /Honda City/ }).click();
    await page.click('a:has-text("Open QR Page")');

    const urlBadge = page.locator("text=/https?:\\/\\/.*\\/v\\//").first();
    await expect(urlBadge).toBeVisible();
    const originalUrl = await urlBadge.innerText();

    // Deactivate goes through the confirmation modal.
    await page.click('button:has-text("Deactivate QR")');
    await page.getByRole("dialog").locator('button:has-text("Deactivate")').click();
    await page.waitForSelector('button:has-text("Activate QR")');
    await expect(page.locator("text=Inactive")).toBeVisible();

    await page.click('button:has-text("Activate QR")');
    await page.waitForSelector('button:has-text("Deactivate QR")');

    // Regenerate rotates the token; the sticker downloads live on this page too.
    await page.click('button:has-text("Regenerate QR")');
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/vehicles/") && r.request().method() === "PATCH"),
      page.getByRole("dialog").locator('button:has-text("Regenerate")').click(),
    ]);
    await page.reload();
    await expect(urlBadge).not.toHaveText(originalUrl);
  });

  test("deleting your only vehicle removes it and re-triggers onboarding (vehicleCount is a standing requirement)", async ({
    page,
  }) => {
    await page.goto("/dashboard/vehicles");
    await page.getByRole("link", { name: /Honda City/ }).click();
    await page.click('button:has-text("Delete vehicle")');
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/vehicles/") && r.request().method() === "DELETE"),
      page.click('button:has-text("Yes, delete")'),
    ]);
    // The dashboard layout's onboarding gate re-checks vehicleCount on every
    // visit, not just at signup — dropping to zero sends the owner back
    // through onboarding rather than showing an empty vehicles list.
    await expect(page).toHaveURL(/\/onboarding/);
  });
});
