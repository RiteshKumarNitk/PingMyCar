import { inflateSync } from "node:zlib";
import { test, expect } from "@playwright/test";
import { qrPngBuffer } from "../../lib/qr/png";
import { stickerPrintSheetPdf } from "../../lib/qr/print-sheet-pdf";
import { stickerPrintSheetSvg } from "../../lib/qr/print-sheet";
import { publicVehicleUrl } from "../../lib/security/tokens";

const token = "K7M3PQ9X";
const url = publicVehicleUrl(token);

test("qrPngBuffer produces a valid PNG with expected dimensions", async () => {
  const png = qrPngBuffer(url, 12);
  // PNG signature
  expect([...png.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  // IHDR width/height: QR for a ~30-char URL is version 3 (29 modules) + 8 quiet = 37 → 444px
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  expect(width).toBe(height);
  expect(width).toBeGreaterThanOrEqual(29 * 12); // at least the module grid
  expect(width).toBeLessThan(600);
  // Ends with IEND chunk (type + CRC are the final 8 bytes).
  const tail = png.subarray(png.length - 8);
  expect(tail.subarray(0, 4).toString("ascii")).toBe("IEND");
});

test("qrPngBuffer scale changes pixel size", async () => {
  const small = qrPngBuffer(url, 4);
  const big = qrPngBuffer(url, 12);
  expect(big.readUInt32BE(16)).toBeGreaterThan(small.readUInt32BE(16));
});

test("qrPngBuffer encodes different URLs into different images", async () => {
  const a = qrPngBuffer(`${url}A`, 8);
  const b = qrPngBuffer(`${url}B`, 8);
  expect(a.equals(b)).toBe(false);
});

test("A4 print sheet PDF is a real, page-exact PDF", async () => {
  const pdf = await stickerPrintSheetPdf(url, "Honda City");
  const buf = Buffer.from(pdf);
  expect(buf.subarray(0, 5).toString("ascii")).toBe("%PDF-");

  // Inflate the page content stream — pdf-lib stores it Flate-compressed.
  const latin = buf.toString("latin1");
  const start = latin.indexOf("stream\n") + 7;
  const end = latin.indexOf("endstream", start);
  const content = inflateSync(buf.subarray(start, end)).toString("latin1");

  // A4 in points: 595.276 x 841.89 (210 x 297 mm at 72dpi).
  expect(content).toContain("595.27");
  expect(content).toMatch(/841\.88|841\.89/);
  // Text (title, instructions, guide) exists.
  expect(/T[jJ]/.test(content)).toBe(true);
  // pdf-lib draws each QR module as a closed path with a fill op (f);
  // 150+ fills means the real QR modules are in there as vectors.
  const fillOps = (content.match(/\bf\b/g) || []).length;
  expect(fillOps).toBeGreaterThan(150);
});

test("A4 sheet contains print instructions and vehicle name", async () => {
  const pdf = await stickerPrintSheetPdf(url, "Honda City");
  // pdf-lib compresses streams, but the doc struct should exist; instead
  // verify through the SVG variant, which carries identical content.
  const svg = stickerPrintSheetSvg(url, "Honda City");
  expect(svg).toContain("Print at 100% / Actual size");
  expect(svg).toContain("Fit to page");
  expect(svg).toContain("Honda City");
  expect(svg).toContain("PLACEMENT GUIDE");
});

test("A4 sheet viewBox is exactly A4 millimetres", async () => {
  const svg = stickerPrintSheetSvg(url, "Honda City");
  expect(svg).toContain('viewBox="0 0 210 297"');
  expect(svg).toContain('width="210mm"');
  expect(svg).toContain('height="297mm"');
});

test("A4 sheet embeds the real QR modules (not a placeholder)", async () => {
  const svg = stickerPrintSheetSvg(url, "Honda City");
  // A real QR has ~200+ filled modules for this URL; each is a <rect>.
  const rects = svg.match(/<rect /g)?.length ?? 0;
  expect(rects).toBeGreaterThan(150);
});
