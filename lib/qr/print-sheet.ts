import { create } from "qrcode";
import { qrModuleRects } from "@/lib/qr/matrix";

/**
 * A4 print sheet (210 × 297 mm) for one PingMyCar sticker at its real
 * physical size. Single source of the sheet geometry; the SVG and PDF
 * generators both render from this so the two outputs are identical.
 *
 * Print rules baked into the sheet:
 *  - 210×297 mm canvas with crop marks at the sticker corners
 *  - "Print at 100% / Actual size — do NOT use Fit to page" instruction
 *  - recommended placement guide
 *  - the REAL vehicle QR (same token/URL as every other surface)
 */

export const SHEET_WIDTH_MM = 210;
export const SHEET_HEIGHT_MM = 297;

const STICKER_W_MM = 76; // ~3" sticker
const STICKER_H_MM = Math.round(560 * (STICKER_W_MM / 360)); // square sticker aspect
const STICKER_X_MM = Math.round((SHEET_WIDTH_MM - STICKER_W_MM) / 2);
const STICKER_Y_MM = 34;

// Square-sticker design px → mm (design canvas is 360×560).
const DESIGN_PX_MM = STICKER_W_MM / 360;
const MM = (px: number) => px * DESIGN_PX_MM;

export type SheetText = {
  text: string;
  xMm: number;
  yMm: number;
  sizeMm: number;
  bold: boolean;
  trackingEm: number; // extra letter spacing, in em
  color: [number, number, number]; // 0-1 RGB
  opacity: number;
  align: "left" | "center";
};

export type SheetLayout = {
  widthMm: number;
  heightMm: number;
  sticker: { xMm: number; yMm: number; wMm: number; hMm: number };
  /** Filled QR modules inside the sticker, in sheet mm. */
  modules: { xMm: number; yMm: number; sizeMm: number }[];
  /** Crop-mark line segments, in sheet mm (from → to). */
  marks: { from: [number, number]; to: [number, number] }[];
  texts: SheetText[];
  lines: { from: [number, number]; to: [number, number] }[];
  recommendedSizeLabel: string;
};

const NAVY: [number, number, number] = [0x0d / 255, 0x19 / 255, 0x26 / 255];
const BLUE: [number, number, number] = [0x25 / 255, 0x63 / 255, 0xeb / 255];

export function buildSheetLayout(publicUrl: string, vehicleName: string): SheetLayout {
  const qrOuter = MM(240);
  const qrInner = MM(240 - 24);
  const qrX = STICKER_X_MM + MM(26 + 12);
  const qrY = STICKER_Y_MM + MM(66 + 12);

  const cell = qrInner / create(publicUrl, { errorCorrectionLevel: "M" }).modules.size;
  const size = create(publicUrl, { errorCorrectionLevel: "M" }).modules.size;
  const modules: SheetLayout["modules"] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!create(publicUrl, { errorCorrectionLevel: "M" }).modules.data[r * size + c]) continue;
      modules.push({ xMm: qrX + c * cell, yMm: qrY + r * cell, sizeMm: cell });
    }
  }

  const tick = 5;
  const off = 3;
  const L = STICKER_X_MM - off;
  const R = STICKER_X_MM + STICKER_W_MM + off;
  const T = STICKER_Y_MM - off;
  const B = STICKER_Y_MM + STICKER_H_MM + off;
  const marks = [
    { from: [L, T], to: [L - tick, T] },
    { from: [L, T], to: [L, T - tick] },
    { from: [R, T], to: [R + tick, T] },
    { from: [R, T], to: [R, T - tick] },
    { from: [L, B], to: [L - tick, B] },
    { from: [L, B], to: [L, B + tick] },
    { from: [R, B], to: [R + tick, B] },
    { from: [R, B], to: [R, B + tick] },
  ] as SheetLayout["marks"];

  const cx = SHEET_WIDTH_MM / 2;
  const texts: SheetText[] = [
    { text: "PINGMYCAR STICKER - A4 PRINT SHEET", xMm: cx, yMm: 16, sizeMm: 2.5, bold: true, trackingEm: 0.06, color: NAVY, opacity: 1, align: "center" },
    { text: `Print at 100% / Actual size - Disable "Fit to page" / "Shrink to fit" - ${vehicleName}`, xMm: cx, yMm: 23, sizeMm: 2, bold: false, trackingEm: 0, color: NAVY, opacity: 0.65, align: "center" },

    { text: "NEED TO CONTACT", xMm: cx, yMm: STICKER_Y_MM + MM(26 + 24), sizeMm: MM(26), bold: true, trackingEm: 0.12, color: NAVY, opacity: 1, align: "center" },
    { text: "THIS VEHICLE?", xMm: cx, yMm: STICKER_Y_MM + MM(26 + 24 + 32), sizeMm: MM(26), bold: true, trackingEm: 0.12, color: NAVY, opacity: 1, align: "center" },

    { text: "SCAN HERE", xMm: cx, yMm: STICKER_Y_MM + MM(66) + qrOuter + MM(42), sizeMm: MM(22), bold: true, trackingEm: 0.35, color: BLUE, opacity: 1, align: "center" },
    { text: "PingMyCar", xMm: cx, yMm: STICKER_Y_MM + STICKER_H_MM - MM(66) + MM(4), sizeMm: MM(20), bold: true, trackingEm: 0.02, color: NAVY, opacity: 1, align: "center" },
    { text: "Your contact info stays private", xMm: cx, yMm: STICKER_Y_MM + STICKER_H_MM - MM(66) + MM(20) + MM(4), sizeMm: MM(10), bold: false, trackingEm: 0, color: NAVY, opacity: 0.5, align: "center" },

    { text: `Recommended size: ${STICKER_W_MM} x ${STICKER_H_MM} mm (print at 100% - the QR must stay at this size to scan reliably)`, xMm: cx, yMm: STICKER_Y_MM + STICKER_H_MM + 22, sizeMm: 1.9, bold: false, trackingEm: 0, color: NAVY, opacity: 0.75, align: "center" },

    { text: "PLACEMENT GUIDE", xMm: 24, yMm: SHEET_HEIGHT_MM - 52, sizeMm: 2, bold: true, trackingEm: 0, color: NAVY, opacity: 1, align: "left" },
    { text: "+ Rear windshield (corner, passenger side)", xMm: 24, yMm: SHEET_HEIGHT_MM - 42, sizeMm: 1.85, bold: false, trackingEm: 0, color: NAVY, opacity: 1, align: "left" },
    { text: "+ Rear side window", xMm: 24, yMm: SHEET_HEIGHT_MM - 35, sizeMm: 1.85, bold: false, trackingEm: 0, color: NAVY, opacity: 1, align: "left" },
    { text: "+ Visible bumper area", xMm: 24, yMm: SHEET_HEIGHT_MM - 28, sizeMm: 1.85, bold: false, trackingEm: 0, color: NAVY, opacity: 1, align: "left" },
    { text: "+ Motorcycle / scooter - visible, not blocking plate", xMm: 24, yMm: SHEET_HEIGHT_MM - 21, sizeMm: 1.85, bold: false, trackingEm: 0, color: NAVY, opacity: 1, align: "left" },
    { text: "The QR points to a private contact page - it never exposes your phone number or email.", xMm: 24, yMm: SHEET_HEIGHT_MM - 11, sizeMm: 1.7, bold: false, trackingEm: 0, color: NAVY, opacity: 0.6, align: "left" },
  ];

  // Sticker inner frame.
  const lines: SheetLayout["lines"] = [
    { from: [STICKER_X_MM + 1.4, STICKER_Y_MM + 1.4], to: [STICKER_X_MM + STICKER_W_MM - 1.4, STICKER_Y_MM + 1.4] },
    { from: [STICKER_X_MM + 1.4, STICKER_Y_MM + 1.4], to: [STICKER_X_MM + 1.4, STICKER_Y_MM + STICKER_H_MM - 1.4] },
    { from: [STICKER_X_MM + STICKER_W_MM - 1.4, STICKER_Y_MM + 1.4], to: [STICKER_X_MM + STICKER_W_MM - 1.4, STICKER_Y_MM + STICKER_H_MM - 1.4] },
    { from: [STICKER_X_MM + 1.4, STICKER_Y_MM + STICKER_H_MM - 1.4], to: [STICKER_X_MM + STICKER_W_MM - 1.4, STICKER_Y_MM + STICKER_H_MM - 1.4] },
    // Blue rule above the brand line.
    { from: [cx - MM(56) / 2, STICKER_Y_MM + STICKER_H_MM - MM(66) - MM(3)], to: [cx + MM(56) / 2, STICKER_Y_MM + STICKER_H_MM - MM(66) - MM(3)] },
  ];

  return {
    widthMm: SHEET_WIDTH_MM,
    heightMm: SHEET_HEIGHT_MM,
    sticker: { xMm: STICKER_X_MM, yMm: STICKER_Y_MM, wMm: STICKER_W_MM, hMm: STICKER_H_MM },
    modules,
    marks,
    texts,
    lines,
    recommendedSizeLabel: `${STICKER_W_MM} × ${STICKER_H_MM} mm`,
  };
}

/** Renders the sheet as a standalone SVG (1 user unit = 1 mm). */
export function stickerPrintSheetSvg(publicUrl: string, vehicleName: string): string {
  const s = buildSheetLayout(publicUrl, vehicleName);
  const rgb = (c: [number, number, number]) =>
    `rgb(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)})`;

  const moduleRects = s.modules
    .map((m) => `<rect x="${m.xMm.toFixed(2)}" y="${m.yMm.toFixed(2)}" width="${m.sizeMm.toFixed(2)}" height="${m.sizeMm.toFixed(2)}"/>`)
    .join("");

  const markLines = s.marks
    .map((m) => `<line x1="${m.from[0]}" y1="${m.from[1]}" x2="${m.to[0]}" y2="${m.to[1]}" stroke="${rgb(NAVY)}" stroke-width="0.3"/>`)
    .join("\n  ");

  const ruleLines = s.lines
    .map((m) => `<line x1="${m.from[0]}" y1="${m.from[1]}" x2="${m.to[0]}" y2="${m.to[1]}" stroke="${rgb(NAVY)}" stroke-width="0.5"/>`)
    .join("\n  ");

  const texts = s.texts
    .map((t) => {
      const weight = t.bold ? ' font-weight="800"' : "";
      const anchor = t.align === "center" ? ' text-anchor="middle"' : "";
      const track = t.trackingEm ? ` letter-spacing="${t.trackingEm}em"` : "";
      return `<text x="${t.xMm.toFixed(2)}" y="${t.yMm.toFixed(2)}"${anchor} font-family="Arial, Helvetica, sans-serif" font-size="${t.sizeMm.toFixed(2)}"${weight}${track} fill="${rgb(t.color)}" fill-opacity="${t.opacity}">${t.text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;")}</text>`;
    })
    .join("\n  ");

  const lightBlueBoxX = STICKER_X_MM + MM(26);
  const lightBlueBoxY = STICKER_Y_MM + MM(66);
  const lightBlueBoxW = MM(240);
  const lightBlueBoxH = MM(240);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm" viewBox="0 0 ${SHEET_WIDTH_MM} ${SHEET_HEIGHT_MM}">
  <rect width="${SHEET_WIDTH_MM}" height="${SHEET_HEIGHT_MM}" fill="#ffffff"/>
  <rect x="${lightBlueBoxX}" y="${lightBlueBoxY}" width="${lightBlueBoxW}" height="${lightBlueBoxH}" rx="${MM(16)}" fill="#e8effc"/>
  <g fill="${rgb(NAVY)}">${moduleRects}</g>
  ${markLines}
  ${ruleLines}
  ${texts}
</svg>`;
}
