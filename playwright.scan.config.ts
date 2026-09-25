import { defineConfig } from "@playwright/test";

/**
 * Browser-based scan tests: render the real sticker SVGs + A4 print sheet in
 * Chromium at print resolution, rasterize, and decode the QR with jsQR to
 * prove the artwork an owner would actually print remains scannable.
 * Run: pnpm test:scan (needs only Chromium, no dev server / DB).
 */
export default defineConfig({
  testDir: "./tests/scan",
  timeout: 30_000,
  fullyParallel: true,
  reporter: [["list"]],
});
