import { test, expect } from "@playwright/test";
import zlib from "node:zlib";
import { PDFDocument } from "pdf-lib";
import { buildA4StickerPackPdf, A4_POINTS } from "@/lib/qr/a4Pdf";
import { STICKER_PRINT_MM, type StickerVariant } from "@/lib/qr/sticker";

/**
 * The A4 print pack must be a real physical-dimension PDF: A4 media box,
 * 100%-scale instructions, per-sticker size captions, and vector crop-mark
 * line operators for every sticker (8 marks × 5 stickers).
 */

const A4_W_MM = 210;
const A4_H_MM = 297;

/** Minimal valid 1×1 white PNG — artwork content is irrelevant to these asserts. */
const TINY_PNG = new Uint8Array(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64"
  )
);

/**
 * Extract a pdf-lib PDF's content: inflate all streams, then split out the
 * human-readable text (hex `Tj` strings, WinAnsi ≈ latin1) and the raw
 * operators (for vector crop-mark asserts).
 */
function pdfContent(bytes: Uint8Array): { text: string; operators: string } {
  const raw = Buffer.from(bytes).toString("latin1");
  let content = raw;
  const streamRe = /stream\r?\n?([\s\S]*?)endstream/g;
  let match: RegExpExecArray | null;
  while ((match = streamRe.exec(raw))) {
    try {
      content += "\n" + zlib.inflateSync(Buffer.from(match[1], "latin1")).toString("latin1");
    } catch {
      content += "\n" + match[1];
    }
  }
  const parts: string[] = [];
  const hexRe = /<([0-9A-Fa-f]+)>\s*Tj/g;
  let hex: RegExpExecArray | null;
  while ((hex = hexRe.exec(content))) {
    parts.push(Buffer.from(hex[1], "hex").toString("latin1"));
  }
  return { text: parts.join("\n"), operators: content };
}

async function buildPack(variants: StickerVariant[]) {
  const bytes = await buildA4StickerPackPdf(
    "QA Vehicle",
    variants.map((variant) => ({ variant, bytes: TINY_PNG }))
  );
  return { bytes, ...pdfContent(bytes) };
}

test.describe("a4 sticker pack PDF", () => {
  test("page is exactly A4 in physical units (210 × 297 mm)", async () => {
    expect(A4_POINTS.w).toBeCloseTo((A4_W_MM * 72) / 25.4, 2);
    expect(A4_POINTS.h).toBeCloseTo((A4_H_MM * 72) / 25.4, 2);
    const { bytes } = await buildPack(["square", "wide", "plate", "round", "arrow"]);
    const pdf = await PDFDocument.load(bytes);
    const [page] = pdf.getPages();
    expect(page.getWidth()).toBeCloseTo((A4_W_MM * 72) / 25.4, 2);
    expect(page.getHeight()).toBeCloseTo((A4_H_MM * 72) / 25.4, 2);
    expect(pdf.getPages().length).toBe(1);
  });

  test("tells the user to print at 100% and warns against fit-to-page", async () => {
    const { text } = await buildPack(["square"]);
    expect(text).toContain("PRINT AT 100% / ACTUAL SIZE");
    expect(text).toContain("Do not select Fit to Page");
  });

  test("draws a size caption and 8 vector crop marks per sticker", async () => {
    const variants: StickerVariant[] = ["square", "wide", "plate", "round", "arrow"];
    const { text, operators } = await buildPack(variants);
    for (const variant of variants) {
      // WinAnsi-safe prefix of each size caption.
      expect(text).toContain(STICKER_PRINT_MM[variant].label.split(" · ")[0]);
    }
    // 5 stickers × 8 crop-mark line segments minimum.
    const lineOps = operators.match(/\bl\b/g)?.length ?? 0;
    expect(lineOps).toBeGreaterThanOrEqual(40);
  });

  test("all caption labels are WinAnsi-encodable (pdf-lib would throw otherwise)", async () => {
    for (const label of Object.values(STICKER_PRINT_MM).map((m) => m.label)) {
      expect(() => Buffer.from(label, "latin1")).not.toThrow();
      expect(/[\u2300-\u23FF]/.test(label)).toBe(false); // no ⌀-style technical chars
    }
  });
});
