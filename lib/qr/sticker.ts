import { create } from "qrcode";
import type { VehicleType } from "@prisma/client";
import { VEHICLE_TYPE_LABELS } from "@/lib/validation/vehicle";
import { qrModuleRects } from "@/lib/qr/matrix";

/**
 * Print-ready PingMyCar vinyl sticker SVGs.
 * Layouts mimic die-cut car stickers (window, bumper strip, license-plate
 * sticker, round badge, arrow badge).
 */

const NAVY = "#0d1926";
const BLUE = "#2563eb";
const LIGHT_BLUE = "#e8effc";

export type StickerVariant = "square" | "wide" | "plate" | "round" | "arrow";

export const STICKER_VARIANTS: { id: StickerVariant; label: string; placement: string }[] = [
  { id: "square", label: "Window vinyl", placement: "Rear windshield" },
  { id: "wide", label: "Bumper strip", placement: "Bumper or plate surround" },
  { id: "plate", label: "License-plate sticker", placement: "Bumper — plate style" },
  { id: "round", label: "Round badge", placement: "Side window or helmet" },
  { id: "arrow", label: "Arrow badge", placement: "Side window — arrow style" },
];

/** Physical print sizes (millimetres). Single source: preview + print + PDF. */
export const STICKER_PRINT_MM: Record<StickerVariant, { w: number; h: number; label: string }> = {
  square: { w: 50, h: 78, label: "Window vinyl · 50 × 78 mm" },
  wide: { w: 90, h: 35, label: "Bumper strip · 90 × 35 mm" },
  plate: { w: 90, h: 35, label: "License-plate sticker · 90 × 35 mm" },
  // NB: "Ø" (Latin-1) not "⌀" — pdf-lib WinAnsi fonts can't encode ⌀.
  round: { w: 50, h: 50, label: "Round badge · Ø50 mm" },
  arrow: { w: 50, h: 50, label: "Arrow badge · Ø50 mm" },
};

/** SVG viewBox dimensions each variant is drawn at (used for print scaling). */
export const STICKER_SOURCE_PX: Record<StickerVariant, { w: number; h: number }> = {
  square: { w: 360, h: 560 },
  wide: { w: 560, h: 220 },
  plate: { w: 560, h: 220 },
  round: { w: 420, h: 420 },
  arrow: { w: 420, h: 420 },
};

type StickerStyle = {
  font: string;
  titleSize: number;
  scanSize: number;
  brandSize: number;
  bodySize: number;
  pad: number;
  qr: number;
  gap: number;
  line1: string;
  line2: string;
};

function styleFor(variant: Exclude<StickerVariant, "round" | "plate" | "arrow">): StickerStyle {
  if (variant === "square") {
    return {
      font: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      titleSize: 26,
      scanSize: 22,
      brandSize: 20,
      bodySize: 12,
      pad: 26,
      qr: 240,
      gap: 14,
      line1: "NEED TO CONTACT",
      line2: "THIS VEHICLE?",
    };
  }
  return {
    font: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
    titleSize: 26,
    scanSize: 22,
    brandSize: 18,
    bodySize: 12,
    pad: 24,
    qr: 190,
    gap: 12,
    line1: "NEED TO CONTACT",
    line2: "THIS VEHICLE?",
  };
}

/**
 * QR block: light-blue rounded frame + white panel + navy modules.
 * The module cell is derived from the INNER white area so the grid always
 * fits its panel exactly, whatever the variant's panel size.
 */
function qrPanelMarkup(qrUrl: string, panel: number, pad: number): string {
  const inner = panel - pad * 2;
  const size = create(qrUrl, { errorCorrectionLevel: "M" }).modules.size;
  // Modules must be SHARP: rounded corners (esp. on the finder patterns)
  // measurably break camera/decoder detection of the printed QR. The white
  // panel provides the quiet zone; styling lives in the frame around it.
  const modules = qrModuleRects(qrUrl, inner / size, 0);
  return `<rect width="${panel}" height="${panel}" rx="14" fill="${LIGHT_BLUE}"/>
  <rect x="${pad}" y="${pad}" width="${inner}" height="${inner}" rx="9" fill="#ffffff"/>
  <g transform="translate(${pad},${pad})" fill="${NAVY}">${modules}</g>`;
}

export function stickerSvgMarkup(
  publicUrl: string,
  variant: StickerVariant = "square",
  vehicleType?: VehicleType | null
): string {
  const font = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
  const esc = (t: string) =>
    t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const typeLine = vehicleType ? VEHICLE_TYPE_LABELS[vehicleType] : null;
  const titleWeight = "font-weight=\"800\" letter-spacing=\"0.12em\"";
  const bodyLine = "Send a private message to the vehicle owner.";

  // Each sticker's QR encodes the visitor URL tagged with its own variant
  // (?s=plate) — that's how per-sticker scan analytics work. Old stickers
  // printed without the tag keep working; they just count as plain scans.
  const sep = publicUrl.includes("?") ? "&" : "?";
  const qrUrl = `${publicUrl}${sep}s=${variant}`;

  if (variant === "round") {
    const S = 420;
    const cx = S / 2;
    const qr = 200;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
  <circle cx="${cx}" cy="${cx}" r="204" fill="#c5ccd6"/>
  <circle cx="${cx}" cy="${cx}" r="198" fill="#ffffff"/>
  <circle cx="${cx}" cy="${cx}" r="188" fill="none" stroke="${NAVY}" stroke-opacity="0.28" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="${cx}" y="72" text-anchor="middle" font-family="${font}" font-size="15" font-weight="800" letter-spacing="0.18em" fill="${NAVY}">NEED TO REACH ME?</text>
  <g transform="translate(${(S - qr) / 2}, 88)">
    ${qrPanelMarkup(qrUrl, qr, 10)}
  </g>
  <text x="${cx}" y="318" text-anchor="middle" font-family="${font}" font-size="16" font-weight="700" letter-spacing="0.3em" fill="${BLUE}">SCAN HERE</text>
  ${typeLine ? `<text x="${cx}" y="340" text-anchor="middle" font-family="${font}" font-size="12" fill="${NAVY}" fill-opacity="0.8">${esc(typeLine)}</text>` : ""}
  <text x="${cx}" y="362" text-anchor="middle" font-family="${font}" font-size="13" font-weight="800" fill="${NAVY}">PingMyCar</text>
  <text x="${cx}" y="380" text-anchor="middle" font-family="${font}" font-size="10" fill="${NAVY}" fill-opacity="0.6">Number stays private</text>
</svg>`;
  }

  if (variant === "arrow") {
    // Round badge with a big direction chevron pointing at the QR — reads as
    // "scan this" from across a parking aisle.
    const S = 420;
    const cx = S / 2;
    const qr = 190;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
  <circle cx="${cx}" cy="${cx}" r="204" fill="${BLUE}"/>
  <circle cx="${cx}" cy="${cx}" r="197" fill="#ffffff"/>
  <circle cx="${cx}" cy="${cx}" r="187" fill="none" stroke="${NAVY}" stroke-opacity="0.28" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="${cx}" y="76" text-anchor="middle" font-family="${font}" font-size="13.5" font-weight="800" letter-spacing="0.12em" fill="${NAVY}">NEED TO CONTACT THE OWNER?</text>
  <path d="M 58 148 L 116 191 L 58 234" fill="none" stroke="${BLUE}" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>
  <g transform="translate(146, 102)">
    ${qrPanelMarkup(qrUrl, qr, 10)}
  </g>
  <text x="${cx}" y="328" text-anchor="middle" font-family="${font}" font-size="16" font-weight="700" letter-spacing="0.3em" fill="${BLUE}">SCAN HERE</text>
  ${typeLine ? `<text x="${cx}" y="349" text-anchor="middle" font-family="${font}" font-size="12" fill="${NAVY}" fill-opacity="0.8">${esc(typeLine)}</text>` : ""}
  <text x="${cx}" y="370" text-anchor="middle" font-family="${font}" font-size="13" font-weight="800" fill="${NAVY}">PingMyCar</text>
  <text x="${cx}" y="388" text-anchor="middle" font-family="${font}" font-size="10" fill="${NAVY}" fill-opacity="0.6">Number stays private</text>
</svg>`;
  }

  if (variant === "plate") {
    // Euro-style license plate: blue band on the left, white plate face,
    // big SCAN ME type right of the QR.
    const W = 560;
    const H = 220;
    const qr = 150;
    const qrY = (H - qr) / 2;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" rx="22" fill="${NAVY}"/>
  <rect x="10" y="10" width="${W - 20}" height="${H - 20}" rx="14" fill="#f5f7fb"/>
  <rect x="10" y="10" width="56" height="${H - 20}" rx="14" fill="${BLUE}"/>
  <rect x="52" y="10" width="14" height="${H - 20}" fill="${BLUE}"/>
  <circle cx="38" cy="46" r="7" fill="#ffffff" fill-opacity="0.9"/>
  <circle cx="38" cy="${H - 46}" r="7" fill="#ffffff" fill-opacity="0.9"/>
  <text x="38" y="${H / 2 + 6}" text-anchor="middle" font-family="${font}" font-size="17" font-weight="900" fill="#ffffff" transform="rotate(-90 38 ${H / 2})">PMC</text>
  <g transform="translate(88, ${qrY})">
    ${qrPanelMarkup(qrUrl, qr, 9)}
  </g>
  <text x="262" y="${qrY + 62}" font-family="${font}" font-size="46" font-weight="900" letter-spacing="0.06em" fill="${NAVY}">SCAN ME</text>
  <text x="262" y="${qrY + 94}" font-family="${font}" font-size="13" fill="${NAVY}" fill-opacity="0.75">Point a camera — message the owner.</text>
  ${typeLine ? `<text x="262" y="${qrY + 118}" font-family="${font}" font-size="12" font-weight="700" fill="${BLUE}">${esc(typeLine)}</text>` : ""}
  <text x="262" y="${H - 26}" font-family="${font}" font-size="12" font-weight="800" fill="${NAVY}">PingMyCar</text>
  <text x="${W - 18}" y="${H - 26}" text-anchor="end" font-family="${font}" font-size="11" fill="${NAVY}" fill-opacity="0.6">Your number stays private</text>
</svg>`;
  }

  const s = styleFor(variant);
  if (variant === "square") {
    const W = 360;
    const H = 560;
    const cx = W / 2;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" rx="28" fill="#d7dde6"/>
  <rect x="6" y="8" width="${W - 12}" height="${H - 14}" rx="24" fill="#c5ccd6"/>
  <rect x="4" y="4" width="${W - 8}" height="${H - 12}" rx="26" fill="#ffffff"/>
  <rect x="10" y="10" width="${W - 20}" height="${H - 24}" rx="20" fill="none" stroke="${NAVY}" stroke-opacity="0.28" stroke-width="1.5" stroke-dasharray="5 4"/>
  <path d="M ${W - 58} 8 L ${W - 12} 8 L ${W - 12} 54 Z" fill="${LIGHT_BLUE}"/>
  <path d="M ${W - 58} 8 L ${W - 12} 54" stroke="${NAVY}" stroke-opacity="0.18" stroke-width="1"/>
  <text x="${cx}" y="${s.pad + 24}" text-anchor="middle" font-family="${s.font}" font-size="${s.titleSize}" ${titleWeight} fill="${NAVY}">${s.line1}</text>
  <text x="${cx}" y="${s.pad + 24 + 32}" text-anchor="middle" font-family="${s.font}" font-size="${s.titleSize}" ${titleWeight} fill="${NAVY}">${s.line2}</text>
  <g transform="translate(${(W - s.qr) / 2}, ${s.pad + 66})">
    ${qrPanelMarkup(qrUrl, s.qr, 12)}
  </g>
  <text x="${cx}" y="${s.pad + 66 + s.qr + 42}" text-anchor="middle" font-family="${s.font}" font-size="${s.scanSize}" font-weight="700" letter-spacing="0.32em" fill="${BLUE}">SCAN HERE</text>
  ${typeLine ? `<text x="${cx}" y="${s.pad + 66 + s.qr + 66}" text-anchor="middle" font-family="${s.font}" font-size="${s.bodySize + 1}" fill="${NAVY}" fill-opacity="0.8">${esc(typeLine)}</text>` : ""}
  <text x="${cx}" y="${s.pad + 66 + s.qr + (typeLine ? 88 : 76)}" text-anchor="middle" font-family="${s.font}" font-size="${s.bodySize}" fill="${NAVY}" fill-opacity="0.65">${bodyLine}</text>
  <rect x="${(W - 56) / 2}" y="${H - 66}" width="56" height="3" rx="1.5" fill="${BLUE}"/>
  <text x="${cx}" y="${H - 36}" text-anchor="middle" font-family="${s.font}" font-size="${s.brandSize}" font-weight="800" letter-spacing="0.02em" fill="${NAVY}">PingMyCar</text>
  <text x="${cx}" y="${H - 16}" text-anchor="middle" font-family="${s.font}" font-size="10" fill="${NAVY}" fill-opacity="0.6">Your contact info stays private</text>
</svg>`;
  }

  const W = 560;
  const H = 220;
  const qrY = (H - s.qr) / 2;
  const textX = s.pad + s.qr + s.gap + 16;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" rx="18" fill="#c5ccd6"/>
  <rect x="4" y="4" width="${W - 8}" height="${H - 10}" rx="16" fill="#ffffff"/>
  <rect x="10" y="10" width="${W - 20}" height="${H - 22}" rx="12" fill="none" stroke="${NAVY}" stroke-opacity="0.28" stroke-width="1.5" stroke-dasharray="6 4"/>
  <g transform="translate(${s.pad}, ${qrY})">
    ${qrPanelMarkup(qrUrl, s.qr, 10)}
  </g>
  <text x="${textX}" y="${qrY + 34}" font-family="${s.font}" font-size="${s.titleSize}" ${titleWeight} fill="${NAVY}">${s.line1}</text>
  <text x="${textX}" y="${qrY + 34 + 30}" font-family="${s.font}" font-size="${s.titleSize}" ${titleWeight} fill="${NAVY}">${s.line2}</text>
  <text x="${textX}" y="${qrY + 106}" font-family="${s.font}" font-size="${s.scanSize}" font-weight="700" letter-spacing="0.32em" fill="${BLUE}">SCAN HERE</text>
  <text x="${textX}" y="${qrY + 130}" font-family="${s.font}" font-size="${s.bodySize}" fill="${NAVY}" fill-opacity="0.65">${bodyLine}</text>
  ${typeLine ? `<text x="${textX}" y="${qrY + 150}" font-family="${s.font}" font-size="${s.bodySize + 1}" fill="${NAVY}" fill-opacity="0.8">${esc(typeLine)}</text>` : ""}
  <text x="${textX}" y="${H - s.pad - 6}" font-family="${s.font}" font-size="${s.brandSize}" font-weight="800" fill="${NAVY}">PingMyCar</text>
</svg>`;
}
