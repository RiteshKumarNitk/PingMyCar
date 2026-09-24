import { create } from "qrcode";
import type { VehicleType } from "@prisma/client";
import { VEHICLE_TYPE_LABELS } from "@/lib/validation/vehicle";
import { qrModuleRects } from "@/lib/qr/matrix";

/**
 * Print-ready PingMyCar vinyl sticker SVGs.
 * Layouts mimic die-cut car stickers (window, bumper strip, round badge).
 */

const NAVY = "#0d1926";
const BLUE = "#2563eb";
const LIGHT_BLUE = "#e8effc";

export type StickerVariant = "square" | "wide" | "round";

export const STICKER_VARIANTS: { id: StickerVariant; label: string; placement: string }[] = [
  { id: "square", label: "Window vinyl", placement: "Rear windshield" },
  { id: "wide", label: "Bumper strip", placement: "Bumper or plate surround" },
  { id: "round", label: "Round badge", placement: "Side window or helmet" },
];

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

function styleFor(variant: Exclude<StickerVariant, "round">): StickerStyle {
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

export function stickerSvgMarkup(
  publicUrl: string,
  variant: StickerVariant = "square",
  vehicleType?: VehicleType | null
): string {
  const font = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
  const cellBase = variant === "round" ? 200 : variant === "wide" ? 190 : 240;
  const cell = cellBase / create(publicUrl, { errorCorrectionLevel: "M" }).modules.size;
  const modules = qrModuleRects(publicUrl, cell, 0.22);
  const esc = (t: string) =>
    t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const typeLine = vehicleType ? VEHICLE_TYPE_LABELS[vehicleType] : null;
  const titleWeight = "font-weight:800;letter-spacing:0.12em";
  const bodyLine = "Send a private message to the vehicle owner.";

  if (variant === "round") {
    const S = 420;
    const cx = S / 2;
    const qr = 200;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
  <circle cx="${cx}" cy="${cx}" r="204" fill="#c5ccd6"/>
  <circle cx="${cx}" cy="${cx}" r="198" fill="#ffffff"/>
  <circle cx="${cx}" cy="${cx}" r="188" fill="none" stroke="${NAVY}" stroke-opacity="0.2" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="${cx}" y="72" text-anchor="middle" font-family="${font}" font-size="15" font-weight="800" letter-spacing="0.18em" fill="${NAVY}">NEED TO REACH ME?</text>
  <g transform="translate(${(S - qr) / 2}, 88)">
    <rect width="${qr}" height="${qr}" rx="18" fill="${LIGHT_BLUE}"/>
    <rect x="10" y="10" width="${qr - 20}" height="${qr - 20}" rx="10" fill="#ffffff"/>
    <g transform="translate(10,10)" fill="${NAVY}">${modules}</g>
  </g>
  <text x="${cx}" y="318" text-anchor="middle" font-family="${font}" font-size="16" font-weight="700" letter-spacing="0.28em" fill="${BLUE}">SCAN HERE</text>
  ${typeLine ? `<text x="${cx}" y="340" text-anchor="middle" font-family="${font}" font-size="12" fill="${NAVY}" fill-opacity="0.75">${esc(typeLine)}</text>` : ""}
  <text x="${cx}" y="362" text-anchor="middle" font-family="${font}" font-size="13" font-weight="800" fill="${NAVY}">PingMyCar</text>
  <text x="${cx}" y="380" text-anchor="middle" font-family="${font}" font-size="10" fill="${NAVY}" fill-opacity="0.5">Number stays private</text>
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
  <rect x="10" y="10" width="${W - 20}" height="${H - 24}" rx="20" fill="none" stroke="${NAVY}" stroke-opacity="0.22" stroke-width="1.5" stroke-dasharray="5 4"/>
  <path d="M ${W - 58} 8 L ${W - 12} 8 L ${W - 12} 54 Z" fill="${LIGHT_BLUE}"/>
  <path d="M ${W - 58} 8 L ${W - 12} 54" stroke="${NAVY}" stroke-opacity="0.18" stroke-width="1"/>
  <text x="${cx}" y="${s.pad + 24}" text-anchor="middle" font-family="${s.font}" font-size="${s.titleSize}" ${titleWeight} fill="${NAVY}">${s.line1}</text>
  <text x="${cx}" y="${s.pad + 24 + 32}" text-anchor="middle" font-family="${s.font}" font-size="${s.titleSize}" ${titleWeight} fill="${NAVY}">${s.line2}</text>
  <g transform="translate(${(W - s.qr) / 2}, ${s.pad + 66})">
    <rect width="${s.qr}" height="${s.qr}" rx="16" fill="${LIGHT_BLUE}"/>
    <rect x="12" y="12" width="${s.qr - 24}" height="${s.qr - 24}" rx="10" fill="#ffffff"/>
    <g transform="translate(12,12)" fill="${NAVY}">${modules}</g>
  </g>
  <text x="${cx}" y="${s.pad + 66 + s.qr + 42}" text-anchor="middle" font-family="${s.font}" font-size="${s.scanSize}" font-weight="700" letter-spacing="0.35em" fill="${BLUE}">SCAN HERE</text>
  ${typeLine ? `<text x="${cx}" y="${s.pad + 66 + s.qr + 66}" text-anchor="middle" font-family="${s.font}" font-size="${s.bodySize + 1}" fill="${NAVY}" fill-opacity="0.75">${esc(typeLine)}</text>` : ""}
  <text x="${cx}" y="${s.pad + 66 + s.qr + (typeLine ? 88 : 76)}" text-anchor="middle" font-family="${s.font}" font-size="${s.bodySize}" fill="${NAVY}" fill-opacity="0.55">${bodyLine}</text>
  <rect x="${(W - 56) / 2}" y="${H - 66}" width="56" height="3" rx="1.5" fill="${BLUE}"/>
  <text x="${cx}" y="${H - 36}" text-anchor="middle" font-family="${s.font}" font-size="${s.brandSize}" font-weight="800" letter-spacing="0.02em" fill="${NAVY}">PingMyCar</text>
  <text x="${cx}" y="${H - 16}" text-anchor="middle" font-family="${s.font}" font-size="10" fill="${NAVY}" fill-opacity="0.5">Your contact info stays private</text>
</svg>`;
  }

  const W = 560;
  const H = 220;
  const qrY = (H - s.qr) / 2;
  const textX = s.pad + s.qr + s.gap + 16;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" rx="18" fill="#c5ccd6"/>
  <rect x="4" y="4" width="${W - 8}" height="${H - 10}" rx="16" fill="#ffffff"/>
  <rect x="10" y="10" width="${W - 20}" height="${H - 22}" rx="12" fill="none" stroke="${NAVY}" stroke-opacity="0.2" stroke-width="1.5" stroke-dasharray="6 4"/>
  <g transform="translate(${s.pad}, ${qrY})">
    <rect width="${s.qr}" height="${s.qr}" rx="14" fill="${LIGHT_BLUE}"/>
    <rect x="10" y="10" width="${s.qr - 20}" height="${s.qr - 20}" rx="8" fill="#ffffff"/>
    <g transform="translate(10,10)" fill="${NAVY}">${modules}</g>
  </g>
  <text x="${textX}" y="${qrY + 34}" font-family="${s.font}" font-size="${s.titleSize}" ${titleWeight} fill="${NAVY}">${s.line1}</text>
  <text x="${textX}" y="${qrY + 34 + 30}" font-family="${s.font}" font-size="${s.titleSize}" ${titleWeight} fill="${NAVY}">${s.line2}</text>
  <text x="${textX}" y="${qrY + 106}" font-family="${s.font}" font-size="${s.scanSize}" font-weight="700" letter-spacing="0.35em" fill="${BLUE}">SCAN HERE</text>
  <text x="${textX}" y="${qrY + 130}" font-family="${s.font}" font-size="${s.bodySize}" fill="${NAVY}" fill-opacity="0.55">${bodyLine}</text>
  ${typeLine ? `<text x="${textX}" y="${qrY + 150}" font-family="${s.font}" font-size="${s.bodySize + 1}" fill="${NAVY}" fill-opacity="0.75">${esc(typeLine)}</text>` : ""}
  <text x="${textX}" y="${H - s.pad - 6}" font-family="${s.font}" font-size="${s.brandSize}" font-weight="800" fill="${NAVY}">PingMyCar</text>
</svg>`;
}
