import type { Page } from "@playwright/test";
import { getOtp } from "./otp";

let counter = 0;

/** A phone number unique to this test process run — avoids collisions between test files/runs. */
export function uniquePhone(): string {
  counter += 1;
  const n = (Date.now() * 1000 + counter) % 10_000_000;
  return `+1555${n.toString().padStart(7, "0")}`;
}

/** Signs up via phone OTP and completes mandatory onboarding (name + first vehicle). */
export async function signUpAndOnboard(
  page: Page,
  opts: { phone: string; name: string; vehicleName: string }
) {
  await page.goto("/signup");
  // Google is the primary flow; the phone-OTP fallback lives inside a
  // collapsed disclosure. Open it before interacting with the phone field.
  await page.click('summary:has-text("Continue with phone instead")');
  await page.fill("#phoneNumber", opts.phone);
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/phone-number/send-otp")),
    page.click('button:has-text("Create account")'),
  ]);
  const code = await getOtp(page.request, opts.phone);
  await page.fill("#code", code);
  await page.click('button:has-text("Verify and continue")');
  await page.waitForURL(/\/(onboarding|dashboard)/);

  // Hard navigation makes the onboarding-complete check deterministic
  // regardless of any client-side soft-navigation timing.
  await page.goto("/onboarding");
  if (page.url().includes("/onboarding")) {
    await page.fill("#name", opts.name);
    await page.fill("#vehicleName", opts.vehicleName);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/vehicles") && r.request().method() === "POST"),
      page.click('button:has-text("Generate My Free QR")'),
    ]);
    // Creating the vehicle lands on the "vehicle is ready" step; the owner is
    // fully onboarded at that point, so the dashboard gate passes.
    await page.waitForURL(/\/onboarding\/ready/);
    await page.goto("/dashboard");
  }
  await page.waitForURL(/\/dashboard/);
}
