import { test, expect } from "@playwright/test";
import { uniquePhone, signUpAndOnboard } from "../helpers/auth";
import { getOtp } from "../helpers/otp";
import { deleteUserByPhone } from "../helpers/db";

test.describe("settings", () => {
  let phone: string;
  let secondPhone: string | undefined;

  test.beforeEach(() => {
    phone = uniquePhone();
    secondPhone = undefined;
  });

  test.afterEach(async () => {
    await deleteUserByPhone(phone);
    if (secondPhone) await deleteUserByPhone(secondPhone);
  });

  test("identity, email, and phone changes all persist across a reload", async ({ page }) => {
    await signUpAndOnboard(page, { phone, name: "Alex Owner", vehicleName: "Honda City" });

    // Identity lives on Profile; email/phone live on Settings.
    await page.goto("/dashboard/profile");
    await expect(page.locator("#settingsName")).toHaveValue("Alex Owner");

    await page.fill("#settingsPreferredName", "AO");
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/auth/update-user")),
      page.click('form:has(#settingsName) button:has-text("Save")'),
    ]);
    await page.reload();
    await expect(page.locator("#settingsPreferredName")).toHaveValue("AO");

    await page.goto("/dashboard/settings");
    await expect(page.locator("#settingsEmail")).toHaveValue("");

    await page.fill("#settingsEmail", "alex.e2e@example.com");
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/auth/change-email")),
      page.click('form:has(#settingsEmail) button:has-text("Save")'),
    ]);
    await page.reload();
    await expect(page.locator("#settingsEmail")).toHaveValue("alex.e2e@example.com");

    secondPhone = uniquePhone();
    await page.fill("#settingsPhone", secondPhone);
    await page.click('form:has(#settingsPhone) button:has-text("Send code")');
    await page.waitForSelector("#settingsPhoneCode");
    const code = await getOtp(page.request, secondPhone);
    await page.fill("#settingsPhoneCode", code);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/phone-number/verify")),
      page.click('button:has-text("Verify")'),
    ]);
    await page.waitForFunction(() =>
      [...document.querySelectorAll("button")].some((b) => b.textContent?.trim() === "Send code")
    );
    await page.reload();
    await expect(page.locator("body")).toContainText(secondPhone);
  });

  test("contact profile shows read-only identity with a link to Profile, not editable inputs", async ({ page }) => {
    await signUpAndOnboard(page, { phone, name: "Alex Owner", vehicleName: "Honda City" });
    await page.goto("/dashboard/vehicles");
    await page.getByRole("link", { name: /Honda City/ }).click();
    await page.click('a:has-text("Edit contact profile")');
    await expect(page.locator("#displayName")).toHaveCount(0);
    await expect(page.locator('a:has-text("Edit in Settings")')).toBeVisible();
    await expect(page.locator("body")).toContainText("Alex Owner");
  });
});
