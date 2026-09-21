import { create } from "qrcode";

/** Renders a QR code as a standalone SVG string — no canvas, no client-side dependency. */
export function qrSvgMarkup(text: string, cellPx = 8): string {
  const qr = create(text, { errorCorrectionLevel: "M" });
  const size = qr.modules.size;
  const data = qr.modules.data;
  const px = size * cellPx;

  let rects = "";
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (data[r * size + c]) {
        rects += `<rect x="${c * cellPx}" y="${r * cellPx}" width="${cellPx}" height="${cellPx}"/>`;
      }
    }
  }

  // width/height="100%" (not fixed px) so the SVG scales to fit whatever
  // container it's dropped into via dangerouslySetInnerHTML.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${px} ${px}" width="100%" height="100%" shape-rendering="crispEdges"><rect width="${px}" height="${px}" fill="#ffffff"/><g fill="#16222c">${rects}</g></svg>`;
}
