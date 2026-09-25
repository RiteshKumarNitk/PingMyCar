import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { stickerSvgMarkup, STICKER_VARIANTS, STICKER_PRINT_MM } from "@/lib/qr/sticker";
import { a4StickerSheetSvg, A4_SHEET_LAYOUT } from "@/lib/qr/a4Sheet";

/**
 * The printed-QR guarantee: whatever an owner prints must scan.
 *
 * These tests render the REAL sticker markup (same functions the dashboard
 * and print page use) inside Chromium, rasterize them at ~300 DPI print
 * size, and decode with jsQR — the same pipeline a phone camera effectively
 * performs. Each sticker's QR must decode to the visitor URL tagged with
 * its own variant (?s=<variant>), which is what powers per-sticker analytics.
 */

/** CJS/ESM-safe require base (import.meta is unavailable after transpile). */
const require = createRequire(process.cwd() + "/package.json");
/** jsQR's UMD bundle, injected into the page (sets window.jsQR). */
const JSQR_SOURCE = readFileSync(require.resolve("jsqr/dist/jsQR.js"), "utf8");

const BASE = "https://pingmycar.test/v/SCANTOKEN";

/**
 * Rasterize an SVG at the given pixel width and decode the QR found in the
 * sub-rectangle (x, y, w, h in source coordinates) — null when none decodes.
 */
async function decodeRegion(
  page: import("@playwright/test").Page,
  svg: string,
  widthPx: number,
  regionMm?: { x: number; y: number; w: number; h: number; pageWidthMm: number }
): Promise<string | null> {
  await page.addScriptTag({ content: JSQR_SOURCE });
  return page.evaluate(
    async ({ svg, widthPx, regionMm }) => {
      const jsQR = (window as unknown as { jsQR: (...args: unknown[]) => { data: string } | null })
        .jsQR;
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      try {
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("svg load failed"));
          img.src = url;
        });
        const scale = widthPx / img.naturalWidth;
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(widthPx);
        canvas.height = Math.round(img.naturalHeight * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("no 2d ctx");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        if (!regionMm) {
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const result = jsQR(data.data, data.width, data.height);
          return result ? result.data : null;
        }
        // Crop the millimetre region (2% guard band) and decode it alone.
        // The canvas shows exactly regionMm.pageWidthMm of artwork width.
        const mmPx = canvas.width / regionMm.pageWidthMm;
        const px = regionMm.x * mmPx;
        const py = regionMm.y * mmPx;
        const pw = regionMm.w * mmPx;
        const ph = regionMm.h * mmPx;
        const guard = Math.max(4, px * 0.02);
        const crop = ctx.getImageData(
          Math.max(0, Math.round(px - guard)),
          Math.max(0, Math.round(py - guard)),
          Math.min(canvas.width - Math.max(0, Math.round(px - guard)), Math.round(pw + guard * 2)),
          Math.min(canvas.height - Math.max(0, Math.round(py - guard)), Math.round(ph + guard * 2))
        );
        const result = jsQR(crop.data, crop.width, crop.height);
        return result ? result.data : null;
      } finally {
        URL.revokeObjectURL(url);
      }
    },
    { svg, widthPx, regionMm: regionMm ?? null }
  );
}

test.describe("printed sticker QR scannability", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("about:blank");
  });

  for (const variant of STICKER_VARIANTS.map((v) => v.id)) {
    test(`${variant} sticker decodes to the visitor URL tagged ?s=${variant}`, async ({ page }) => {
      const svg = stickerSvgMarkup(BASE, variant);
      const mm = STICKER_PRINT_MM[variant];
      // ~12 px/mm ≈ 300 DPI — print resolution.
      const decoded = await decodeRegion(page, svg, Math.round(mm.w * 12));
      expect(decoded).toBe(`${BASE}?s=${variant}`);
    });
  }

  test("every sticker on the A4 print sheet decodes at print resolution", async ({ page }) => {
    const sheet = a4StickerSheetSvg(BASE, "QA Vehicle");
    const pxPerMm = 8; // ~200 DPI on the full A4 page
    for (const { variant, xMm, yMm } of A4_SHEET_LAYOUT) {
      const mm = STICKER_PRINT_MM[variant];
      const decoded = await decodeRegion(
        page,
        sheet,
        210 * pxPerMm,
        { x: xMm, y: yMm, w: mm.w, h: mm.h, pageWidthMm: 210 }
      );
      expect(decoded, `${variant} sticker region on the A4 sheet`).toBe(`${BASE}?s=${variant}`);
    }
  });
});
