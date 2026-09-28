import { test, expect } from "@playwright/test";
import { signInAsGoogleUser, signInWithGoogleAndOnboard, type TestOwner } from "../helpers/auth";
import { deleteUserById, E2E_BASE_URL } from "../helpers/db";

test.describe("auth & onboarding (Google-only owners)", () => {
  let owner: TestOwner | undefined;

  test.afterEach(async () => {
    await deleteUserById(owner?.userId);
    owner = undefined;
  });

  test("login and signup offer no phone, OTP, or email/password option", async ({ page }) => {
    for (const path of ["/login", "/signup"]) {
      await page.goto(path);
      await expect(page.getByText(/continue with phone/i)).toHaveCount(0);
      await expect(page.locator("#phoneNumber, input[type=tel], input[type=password]")).toHaveCount(0);
    }
  });

  test("phone login and public email sign-up are disabled server-side", async ({ request }) => {
    const origin = { Origin: new URL(E2E_BASE_URL).origin };
    for (const path of ["/api/auth/phone-number/send-otp", "/api/auth/phone-number/verify", "/api/auth/sign-in/phone-number"]) {
      const res = await request.post(path, { headers: origin, data: { phoneNumber: "+15550000000", code: "000000" } });
      expect(res.status(), path).toBe(404);
    }
    const signUp = await request.post("/api/auth/sign-up/email", {
      headers: origin,
      data: { email: `nope-${Date.now()}@example.test`, password: "Password!234", name: "Nope" },
    });
    expect(signUp.ok()).toBe(false);
    expect((await request.get("/api/test/last-otp?phoneNumber=%2B15550000000")).status()).toBe(404);
  });

  test("Google sign-in completes mandatory onboarding before reaching the dashboard", async ({ page }) => {
    owner = await signInWithGoogleAndOnboard(page, { name: "Test Owner", vehicleName: "Test Car" });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("hard navigation to any dashboard route bounces an unonboarded Google user to /onboarding", async ({ page }) => {
    owner = await signInAsGoogleUser(page.context(), { name: "Fresh Owner" });
    for (const path of ["/dashboard", "/dashboard/vehicles/new", "/dashboard/messages"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/onboarding/);
    }
  });

  test("an already-onboarded user visiting /onboarding is bounced to /dashboard", async ({ page }) => {
    owner = await signInWithGoogleAndOnboard(page, { name: "Test Owner", vehicleName: "Test Car" });
    await page.goto("/onboarding");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("an unauthenticated visitor to /onboarding is redirected to /login", async ({ page }) => {
    await page.goto("/onboarding");
    await expect(page).toHaveURL(/\/login/);
  });
});

