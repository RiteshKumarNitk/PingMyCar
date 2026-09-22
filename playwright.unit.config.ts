import { defineConfig } from "@playwright/test";

// Pure-logic tests — no browser, no dev server, no DB.
export default defineConfig({
  testDir: "./tests/unit",
  timeout: 10_000,
  fullyParallel: true,
  reporter: [["list"]],
});
