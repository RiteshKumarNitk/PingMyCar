import { create } from "qrcode";

/**
 * Single owner of QR-matrix→SVG-rect rendering: one loop builds the `<rect>`
 * grid, both SVG shapes (bare code and full sticker) reuse it.
 */
function qrRects(text: string, cell: number, rx = 0): string {
  const qr = create(text, { errorCorrectionLevel: "M" });
  const size = qr.modules.size;
  const data = qr.modules.data;
  const corner = rx > 0 ? ` rx="${(cell * rx).toFixed(2)}"` : "";
  let rects = "";
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (data[r * size + c]) {
        rects += `<rect x="${(c * cell).toFixed(2)}" y="${(r * cell).toFixed(2)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}"${corner}/>`;
      }
    }
  }
  return rects;
}

/** Renders a QR code as a standalone SVG string — no canvas, no client-side dependency. */
export function qrSvgMarkup(text: string, cellPx = 8): string {
  const px = create(text, { errorCorrectionLevel: "M" }).modules.size * cellPx;
  const rects = qrRects(text, cellPx);

  // width/height="100%" (not fixed px) so the SVG scales to fit whatever
  // container it's dropped into via dangerouslySetInnerHTML.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${px} ${px}" width="100%" height="100%" shape-rendering="crispEdges"><rect width="${px}" height="${px}" fill="#ffffff"/><g fill="#16222c">${rects}</g></svg>`;
}

/** Bare QR modules grid (no background frame) for embedding in other SVGs. */
export function qrModuleRects(text: string, cell: number, rx: number): string {
  return qrRects(text, cell, rx);
}
