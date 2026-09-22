import { test, expect } from "@playwright/test";
import { uniquePhone, signUpAndOnboard } from "../helpers/auth";
import { getOtp } from "../helpers/otp";
import { deleteUserByPhone } from "../helpers/db";

test.describe("auth & onboarding", () => {
  let phone: string;

  test.beforeEach(() => {
    phone = uniquePhone();
  });

  test.afterEach(async () => {
    await deleteUserByPhone(phone);
  });

  test("Google sign-in button stays hidden without configured credentials", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator('button:has-text("Continue with Google")')).toHaveCount(0);
  });

  test("phone signup completes mandatory onboarding before reaching the dashboard", async ({ page }) => {
    await signUpAndOnboard(page, { phone, name: "Test Owner", vehicleName: "Test Car" });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("hard navigation to any dashboard route bounces an unonboarded user to /onboarding", async ({ page }) => {
    await page.goto("/signup");
    await page.fill("#phoneNumber", phone);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/phone-number/send-otp")),
      page.click('button:has-text("Create account")'),
    ]);
    const code = await getOtp(page.request, phone);
    await page.fill("#code", code);
    await page.click('button:has-text("Verify and continue")');
    await page.waitForURL(/\/(onboarding|dashboard)/);

    for (const path of ["/dashboard", "/dashboard/vehicles/new", "/dashboard/messages"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/onboarding/);
    }
  });

  test("an already-onboarded user visiting /onboarding is bounced to /dashboard", async ({ page }) => {
    await signUpAndOnboard(page, { phone, name: "Test Owner", vehicleName: "Test Car" });
    await page.goto("/onboarding");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("an unauthenticated visitor to /onboarding is redirected to /login", async ({ page }) => {
    await page.goto("/onboarding");
    await expect(page).toHaveURL(/\/login/);
  });
});
