import { PDFDocument, PDFFont, PDFPage, PDFImage, rgb } from "pdf-lib";
import { STICKER_PRINT_MM, type StickerVariant } from "@/lib/qr/sticker";

/**
 * A4 printable sticker pack — a real PDF with physical units.
 *
 * A4 = 210 × 297 mm. pdf-lib works in points (1 pt = 1/72 in;
 * 1 mm = 72/25.4 pt ≈ 2.8346 pt), so every placement below is computed in
 * millimetres and converted once. Printed at 100% scale the stickers come
 * out at exactly the STICKER_PRINT_MM sizes.
 *
 * The sticker artwork is rasterized from the existing sticker SVG (same
 * markup the dashboard previews use) at high DPI, so the printed sticker
 * matches the preview exactly. Crop marks are drawn as vector lines OUTSIDE
 * the sticker rectangle — they never touch the QR quiet zone.
 */

const MM = 72 / 25.4; // pt per mm

export const A4 = { wMm: 210, hMm: 297 };
export const A4_POINTS = { w: A4.wMm * MM, h: A4.hMm * MM };

const NAVY = rgb(0.051, 0.098, 0.149);
const BLUE = rgb(0.145, 0.388, 0.922);
const GREY = rgb(0.42, 0.45, 0.5);
const LIGHT = rgb(0.94, 0.95, 0.97);

/**
 * Draw one sticker image centered in its cell with crop marks at the four
 * corners. Marks sit `gapMm` outside the artwork, well clear of the QR's
 * quiet zone (the sticker SVG already reserves its own internal margin).
 */
async function drawStickerWithMarks(
  pdf: PDFDocument,
  page: PDFPage,
  png: PDFImage,
  variant: StickerVariant,
  xMm: number,
  yTopMm: number
): Promise<void> {
  const { w, h } = STICKER_PRINT_MM[variant];
  const x = xMm * MM;
  // pdf-lib y-axis starts at the page bottom; convert top-origin to bottom-origin.
  const y = (A4.hMm - yTopMm - h) * MM;

  page.drawImage(png, { x, y, width: w * MM, height: h * MM });

  // Crop marks: 3 mm long, 1.2 mm offset from the artwork edge.
  const len = 3 * MM;
  const gap = 1.2 * MM;
  const black = rgb(0.07, 0.07, 0.07);
  const corners: Array<[number, number, number, number]> = [
    // [cx, cy, dx, dy] — line starts gap away from the corner, pointing out
    [x, y + h * MM, 0, gap + len], // top-left vertical
    [x, y + h * MM, -gap - len, 0], // top-left horizontal
    [x + w * MM, y + h * MM, 0, gap + len], // top-right vertical
    [x + w * MM, y + h * MM, gap + len, 0], // top-right horizontal
    [x, y, 0, -gap - len], // bottom-left vertical
    [x, y, -gap - len, 0], // bottom-left horizontal
    [x + w * MM, y, 0, -gap - len], // bottom-right vertical
    [x + w * MM, y, gap + len, 0], // bottom-right horizontal
  ];
  for (const [cx, cy, dx, dy] of corners) {
    page.drawLine({
      start: { x: cx, y: cy },
      end: { x: cx + dx, y: cy + dy },
      thickness: 0.5,
      color: black,
    });
  }
}

/**
 * WinAnsi-safe text: pdf-lib's built-in fonts throw on any character outside
 * CP1252 (emoji, Devanagari, CJK…), which would kill the whole PDF download
 * for perfectly legal vehicle names. Map common typographic punctuation,
 * then drop anything else rather than fail.
 */
const WINANSI_EXTRA: Record<string, string> = {
  "—": "-", "–": "-", "\u2018": "'", "\u2019": "'",
  "\u201C": '"', "\u201D": '"', "…": "...", "€": "EUR",
};

function toWinAnsi(text: string): string {
  let out = "";
  for (const ch of text) {
    if (WINANSI_EXTRA[ch]) {
      out += WINANSI_EXTRA[ch];
    } else if (ch.codePointAt(0)! <= 0xff) {
      out += ch;
    } // else: unencodable — skipped
  }
  return out;
}

function drawInstructions(
  page: PDFPage,
  fonts: { bold: PDFFont; regular: PDFFont },
  vehicleName: string
): void {
  const { bold, regular } = fonts;
  const left = 15 * MM;
  let y = A4.hMm - 14 * MM;

  page.drawText("PingMyCar sticker pack", {
    x: left,
    y,
    size: 16,
    font: bold,
    color: NAVY,
  });
  y -= 6 * MM;
  page.drawText(toWinAnsi(vehicleName.slice(0, 60)), { x: left, y, size: 10, font: regular, color: GREY });
  y -= 8 * MM;

  page.drawText("PRINT AT 100% / ACTUAL SIZE", { x: left, y, size: 12, font: bold, color: BLUE });
  y -= 5 * MM;
  page.drawText("Do not select Fit to Page, Shrink to Fit, or similar scaling options.", {
    x: left,
    y,
    size: 9,
    font: regular,
    color: NAVY,
  });
  y -= 5 * MM;
  page.drawText("Check the printed size with a ruler before cutting: each mark-to-mark span equals the sticker size listed below.", {
    x: left,
    y,
    size: 8,
    font: regular,
    color: GREY,
  });
  y -= 10 * MM;
}

function drawPlacementGuide(
  page: PDFPage,
  fonts: { bold: PDFFont; regular: PDFFont }
): void {
  const { bold, regular } = fonts;
  const left = 15 * MM;
  // Stickers + captions end at 172 mm from the top; the guide lives below.
  let y = 178 * MM;

  page.drawText("Where should I place my PingMyCar sticker?", {
    x: left,
    y,
    size: 12,
    font: bold,
    color: NAVY,
  });
  y -= 6 * MM;
  const placements = [
    "1. Rear windshield — window vinyl, facing outward, unobstructed by wipers.",
    "2. Bumper or plate surround — strip or plate-style sticker, readable from behind.",
    "3. Side window or helmet — round or arrow badge, scannable from the next space.",
  ];
  for (const line of placements) {
    page.drawText(line, { x: left, y, size: 9, font: regular, color: NAVY });
    y -= 5 * MM;
  }
  y -= 2 * MM;
  const legal =
    "Place the sticker where it is visible and easy to scan without obstructing the driver's view, lights, license plate, or other required vehicle equipment. Follow local vehicle regulations.";
  for (const line of wrapText(legal, 95)) {
    page.drawText(line, { x: left, y, size: 8, font: regular, color: GREY });
    y -= 4.2 * MM;
  }
  y -= 4 * MM;

  const boxY = y - 34 * MM;
  page.drawRectangle({
    x: left,
    y: boxY,
    width: (A4.wMm - 30) * MM,
    height: 34 * MM,
    color: LIGHT,
    borderColor: rgb(0.83, 0.86, 0.9),
    borderWidth: 0.5,
  });
  let by = boxY + 34 * MM - 7 * MM;
  page.drawText("How a scan works", { x: left + 6 * MM, y: by, size: 10, font: bold, color: NAVY });
  by -= 5.5 * MM;
  const scanLines = [
    "A visitor scans the QR and opens the page in their phone browser. No app, no account.",
    "They pick a reason and send a private message. You reply from your PingMyCar dashboard.",
    "Neither side sees a phone number. If you regenerate this QR, reprint the pack.",
    "This is not an emergency service. For a genuine emergency, call local emergency numbers.",
  ];
  for (const line of scanLines) {
    page.drawText(line, { x: left + 6 * MM, y: by, size: 8, font: regular, color: NAVY });
    by -= 4.6 * MM;
  }
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars) {
      lines.push(current.trim());
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines;
}

/**
 * Build the full A4 PDF for a vehicle's sticker pack.
 * Sticker PNGs must be pre-rasterized client-side (same renderer as the
 * dashboard previews) — see PrintPackActions for the caller.
 */
export async function buildA4StickerPackPdf(
  vehicleName: string,
  stickerPngs: { variant: StickerVariant; bytes: Uint8Array }[]
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`PingMyCar sticker pack — ${vehicleName}`);
  pdf.setSubject("Print at 100% / actual size");

  const page = pdf.addPage([A4_POINTS.w, A4_POINTS.h]);
  const bold = await pdf.embedFont("Helvetica-Bold");
  const regular = await pdf.embedFont("Helvetica");

  drawInstructions(page, { bold, regular }, vehicleName);

  // Lay out (top-origin mm): window left; bumper + plate stacked in the
  // middle column; round + arrow badges side by side below them.
  const layout: { variant: StickerVariant; xMm: number; yTopMm: number }[] = [
    { variant: "square", xMm: 18, yTopMm: 30 },
    { variant: "wide", xMm: 85, yTopMm: 30 },
    { variant: "plate", xMm: 85, yTopMm: 74 },
    { variant: "round", xMm: 85, yTopMm: 118 },
    { variant: "arrow", xMm: 140, yTopMm: 118 },
  ];

  const byVariant = new Map(stickerPngs.map((s) => [s.variant, s.bytes]));
  for (const slot of layout) {
    const bytes = byVariant.get(slot.variant);
    if (!bytes) continue;
    const png = await pdf.embedPng(bytes);
    const mm = STICKER_PRINT_MM[slot.variant];
    await drawStickerWithMarks(pdf, page, png, slot.variant, slot.xMm, slot.yTopMm);
    // Size caption under each sticker (captions end well above the guide).
    const captionY = (A4.hMm - slot.yTopMm - mm.h - 4) * MM;
    page.drawText(mm.label, {
      x: slot.xMm * MM,
      y: captionY,
      size: 8,
      font: regular,
      color: GREY,
    });
  }

  drawPlacementGuide(page, { bold, regular });

  return pdf.save();
}
