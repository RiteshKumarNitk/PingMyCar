import { defineConfig } from "@playwright/test";

/**
 * Conversation privacy/authorization integration suite.
 *
 * Runs against an ALREADY RUNNING app (no webServer here) that is connected
 * to a throwaway database, and talks to that same database directly to set
 * admin roles and assert audit rows. It refuses to run unless
 * INTEGRATION_DATABASE_URL points at localhost — never production. See
 * tests/integration/conversations.spec.ts for setup.
 */
export default defineConfig({
  testDir: "./tests/integration",
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.INTEGRATION_BASE_URL ?? "http://localhost:3100",
    trace: "retain-on-failure",
    // Use an installed Chrome when available (INTEGRATION_BROWSER_CHANNEL=chrome)
    // instead of downloading Playwright's bundled build.
    ...(process.env.INTEGRATION_BROWSER_CHANNEL ? { channel: process.env.INTEGRATION_BROWSER_CHANNEL } : {}),
  },
});
