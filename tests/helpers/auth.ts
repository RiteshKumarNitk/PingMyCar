import { randomUUID } from "node:crypto";
import type { BrowserContext, Page } from "@playwright/test";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { testUtils } from "better-auth/plugins";
import { assertLocalTestDatabase, E2E_BASE_URL, testDb } from "./db";

/**
 * Google sign-in for E2E tests.
 *
 * Real Google OAuth can't run unattended, so tests create the exact state a
 * successful "Continue with Google" leaves behind — a user with a verified
 * email plus a linked `google` Account row — and mint a real session for it
 * with Better Auth's official `test-utils` plugin.
 *
 * The plugin lives ONLY in this test-process auth instance (it registers no
 * HTTP routes, and the app's own auth config never includes it), so nothing
 * here exists in the deployed app. Cookies are signed with the same secret
 * the dev server uses, so the app validates them like any other session.
 */
const testAuth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET,
  baseURL: E2E_BASE_URL,
  database: prismaAdapter(testDb, { provider: "postgresql" }),
  // The dev server (NODE_ENV=development) uses non-__Secure- cookie names.
  advanced: { useSecureCookies: false },
  user: {
    additionalFields: {
      preferredName: { type: "string", required: false },
      phoneNumber: { type: "string", required: false, input: false },
    },
  },
  plugins: [testUtils()],
});

export type TestOwner = { userId: string; email: string };

/** Creates a Google-authenticated owner and signs `context` in as them. */
export async function signInAsGoogleUser(
  context: BrowserContext,
  opts: { name: string; email?: string }
): Promise<TestOwner> {
  assertLocalTestDatabase();
  const ctx = await testAuth.$context;
  const email = opts.email ?? `e2e-${randomUUID()}@example.test`;
  const user = await ctx.test.saveUser(ctx.test.createUser({ email, name: opts.name, emailVerified: true }));
  // The linked-provider row a real Google sign-in creates.
  await testDb.account.create({
    data: { userId: user.id, providerId: "google", accountId: `e2e-google-${randomUUID()}` },
  });
  const cookies = await ctx.test.getCookies({ userId: user.id, domain: new URL(E2E_BASE_URL).hostname });
  await context.addCookies(cookies);
  return { userId: user.id, email };
}

/**
 * Google sign-in, then the mandatory onboarding (first vehicle; name too if
 * the account has none), ending on /dashboard.
 */
export async function signInWithGoogleAndOnboard(
  page: Page,
  opts: { name: string; vehicleName: string }
): Promise<TestOwner> {
  const owner = await signInAsGoogleUser(page.context(), { name: opts.name });

  await page.goto("/onboarding");
  if (page.url().includes("/onboarding")) {
    if (await page.locator("#name").count()) await page.fill("#name", opts.name);
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
  return owner;
}
