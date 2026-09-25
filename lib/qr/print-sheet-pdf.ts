import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { buildSheetLayout } from "@/lib/qr/print-sheet";

/**
 * Vector A4 PDF of the print sheet, built from the same layout the SVG
 * variant uses. Millimetres → PDF points (1 mm = 72/25.4 pt), origin flips
 * from top-left (layout space) to bottom-left (PDF space). No rasterized
 * images: QR modules are drawn as vector rectangles, so the code prints
 * crisp at any DPI.
 */
export async function stickerPrintSheetPdf(publicUrl: string, vehicleName: string): Promise<Uint8Array> {
  const s = buildSheetLayout(publicUrl, vehicleName);
  const PT = 72 / 25.4;

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([s.widthMm * PT, s.heightMm * PT]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const toX = (mm: number) => mm * PT;
  const toY = (mm: number) => (s.heightMm - mm) * PT;

  // White background.
  page.drawRectangle({
    x: 0,
    y: 0,
    width: s.widthMm * PT,
    height: s.heightMm * PT,
    color: rgb(1, 1, 1),
  });

  // QR modules (vector rects).
  for (const m of s.modules) {
    page.drawRectangle({
      x: toX(m.xMm),
      y: toY(m.yMm + m.sizeMm),
      width: m.sizeMm * PT,
      height: m.sizeMm * PT,
      color: rgb(0x0d / 255, 0x19 / 255, 0x26 / 255),
    });
  }

  // Crop marks + rules.
  for (const l of [...s.marks, ...s.lines]) {
    page.drawLine({
      start: { x: toX(l.from[0]), y: toY(l.from[1]) },
      end: { x: toX(l.to[0]), y: toY(l.to[1]) },
      thickness: 0.3,
      color: rgb(0x0d / 255, 0x19 / 255, 0x26 / 255),
    });
  }

  // Text (baseline in layout space is already the y we want).
  for (const t of s.texts) {
    const size = t.sizeMm * PT * 2.835; // mm font-size → pt
    page.drawText(t.text, {
      x: t.align === "center" ? toX(t.xMm) - (font.widthOfTextAtSize(t.text, size) / 2) : toX(t.xMm),
      y: toY(t.yMm),
      size,
      font: t.bold ? bold : font,
      color: rgb(t.color[0], t.color[1], t.color[2]),
      opacity: t.opacity,
    });
  }

  return pdf.save();
}
