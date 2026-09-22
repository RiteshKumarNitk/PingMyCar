import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  // Generous: dev-mode on-demand route compilation (many routes now) can eat
  // tens of seconds before the final assertion of a flow.
  timeout: 90_000,
  // Tests share one dev Postgres DB (no ephemeral test DB yet) — run
  // sequentially to avoid cross-test interference (rate limits, counts).
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3100",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
