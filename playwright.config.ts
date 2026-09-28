import { defineConfig } from "@playwright/test";

/**
 * E2E suite. Requires a throwaway local database:
 *
 *   E2E_DATABASE_URL=postgresql://…@localhost:5432/pingmycar_test
 *   DATABASE_URL=$E2E_DATABASE_URL prisma migrate deploy   # once
 *   E2E_DATABASE_URL=… pnpm test:e2e
 *
 * The dev server started below is pointed at E2E_DATABASE_URL (never .env's
 * DATABASE_URL), and the test helpers refuse any non-localhost database.
 * Owners sign in through the Google test-session helper (tests/helpers/auth.ts).
 */
const E2E_DATABASE_URL = process.env.E2E_DATABASE_URL ?? "";
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3100";

export default defineConfig({
  testDir: "./tests/e2e",
  // Generous: dev-mode on-demand route compilation (many routes now) can eat
  // tens of seconds before the final assertion of a flow.
  timeout: 90_000,
  // Tests share one database — run sequentially to avoid cross-test
  // interference (rate limits, counts).
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    // Set E2E_BROWSER_CHANNEL=chrome to use an installed Chrome.
    ...(process.env.E2E_BROWSER_CHANNEL ? { channel: process.env.E2E_BROWSER_CHANNEL } : {}),
  },
  webServer: {
    // process.execPath: the same Node running Playwright, even when `node`
    // isn't on the shell PATH (e.g. nvm-windows setups).
    command: `"${process.execPath}" node_modules/next/dist/bin/next dev --turbopack -p 3100`,
    url: BASE_URL,
    // Only reuse an already-running server when explicitly asked to, so a dev
    // server connected to another database is never picked up by accident.
    reuseExistingServer: process.env.E2E_REUSE_SERVER === "1",
    timeout: 120_000,
    env: {
      DATABASE_URL: E2E_DATABASE_URL,
      BETTER_AUTH_URL: BASE_URL,
      NEXT_PUBLIC_APP_URL: BASE_URL,
      // Keep tests off real external services.
      UPSTASH_REDIS_REST_URL: "",
      UPSTASH_REDIS_REST_TOKEN: "",
      GOOGLE_APPLICATION_CREDENTIALS_JSON: "",
      INITIAL_SUPER_ADMIN_EMAIL: "",
    },
  },
});
