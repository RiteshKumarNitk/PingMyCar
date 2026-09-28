import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

/**
 * Conversation privacy/authorization integration suite. Same local-database
 * requirements and dev server as the E2E suite (see playwright.config.ts);
 * the tests refuse to run unless E2E_DATABASE_URL points at localhost.
 */
export default defineConfig({
  ...base,
  testDir: "./tests/integration",
  timeout: 120_000,
});
