import type { VehicleType } from "@prisma/client";
import { stickerSvgMarkup, type StickerVariant } from "@/lib/qr/sticker";

/** Physical print sizes (millimetres). Print at 100% / actual size. */
export const STICKER_PRINT_MM: Record<StickerVariant, { w: number; h: number; label: string }> = {
  square: { w: 50, h: 78, label: "Window vinyl · 50 × 78 mm" },
  wide: { w: 90, h: 35, label: "Bumper strip · 90 × 35 mm" },
  round: { w: 50, h: 50, label: "Round badge · 50 mm" },
};

const SOURCE: Record<StickerVariant, { w: number; h: number }> = {
  square: { w: 360, h: 560 },
  wide: { w: 560, h: 220 },
  round: { w: 420, h: 420 },
};

function cropMarks(x: number, y: number, w: number, h: number, len = 3): string {
  const m = 1.2;
  const lines = [
    [x, y - m, x, y - m - len],
    [x - m, y, x - m - len, y],
    [x + w, y - m, x + w, y - m - len],
    [x + w + m, y, x + w + m + len, y],
    [x, y + h + m, x, y + h + m + len],
    [x - m, y + h, x - m - len, y + h],
    [x + w, y + h + m, x + w, y + h + m + len],
    [x + w + m, y + h, x + w + m + len, y + h],
  ];
  return lines
    .map(
      ([x1, y1, x2, y2]) =>
        `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#111" stroke-width="0.2"/>`
    )
    .join("");
}

function embedSticker(svg: string, variant: StickerVariant, x: number, y: number): string {
  const src = SOURCE[variant];
  const mm = STICKER_PRINT_MM[variant];
  const scale = mm.w / src.w;
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  return `<g transform="translate(${x} ${y}) scale(${scale})">${inner}</g>${cropMarks(x, y, mm.w, mm.h)}`;
}

export function a4StickerSheetSvg(
  publicUrl: string,
  vehicleName: string,
  vehicleType?: VehicleType | null
): string {
  const square = stickerSvgMarkup(publicUrl, "square", vehicleType);
  const wide = stickerSvgMarkup(publicUrl, "wide", vehicleType);
  const round = stickerSvgMarkup(publicUrl, "round", vehicleType);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm" viewBox="0 0 210 297">
  <rect width="210" height="297" fill="#ffffff"/>
  <text x="15" y="16" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="5.5" font-weight="800" fill="#0d1926">PingMyCar sticker pack</text>
  <text x="15" y="23" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="3.4" fill="#0d1926">${escapeXml(vehicleName)}</text>
  <text x="15" y="29" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="3.2" font-weight="700" fill="#2563eb">PRINT AT 100% / ACTUAL SIZE. Do not “fit to page”.</text>
  <text x="15" y="35" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="3" fill="#555">Cut on the dashed vinyl edge. Crop marks show the finished size.</text>

  ${embedSticker(square, "square", 18, 44)}
  <text x="18" y="128" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="2.8" fill="#333">${STICKER_PRINT_MM.square.label} · rear windshield</text>

  ${embedSticker(wide, "wide", 80, 44)}
  <text x="80" y="86" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="2.8" fill="#333">${STICKER_PRINT_MM.wide.label} · bumper</text>

  ${embedSticker(round, "round", 80, 96)}
  <text x="80" y="152" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="2.8" fill="#333">${STICKER_PRINT_MM.round.label} · side window or helmet</text>

  <line x1="15" y1="162" x2="195" y2="162" stroke="#ddd" stroke-width="0.3"/>
  <text x="15" y="172" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="4" font-weight="800" fill="#0d1926">Place it here</text>
  <text x="15" y="180" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="3" fill="#333">1. Rear windshield — window vinyl, facing outward, unobstructed by wipers.</text>
  <text x="15" y="186" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="3" fill="#333">2. Bumper or plate surround — strip format, readable from behind the vehicle.</text>
  <text x="15" y="192" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="3" fill="#333">3. Side window or helmet — round badge, easy to scan from the next parking space.</text>
  <text x="15" y="202" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="3" fill="#555">Someone standing outside should be able to scan without opening a door.</text>
  <text x="15" y="210" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="3" fill="#555">Follow local vehicle and road-safety rules. Do not cover lights, plates, or sensors.</text>

  <rect x="15" y="220" width="180" height="58" rx="3" fill="#f4f6fa" stroke="#d5dbe6" stroke-width="0.3"/>
  <text x="21" y="232" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="3.4" font-weight="700" fill="#0d1926">How a scan works</text>
  <text x="21" y="241" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="3" fill="#333">A visitor opens the QR in their phone browser. No app. No phone number is shown.</text>
  <text x="21" y="248" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="3" fill="#333">They pick a reason and send a private message. You reply from PingMyCar.</text>
  <text x="21" y="255" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="3" fill="#333">If you regenerate this QR, reprint the pack — old stickers will stop working.</text>
  <text x="21" y="266" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="2.8" fill="#666">This is not an emergency service. For a genuine emergency, call local emergency numbers.</text>
</svg>`;
}

function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
