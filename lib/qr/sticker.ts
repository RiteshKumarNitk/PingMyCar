import { create } from "qrcode";
import type { VehicleType } from "@prisma/client";
import { VEHICLE_TYPE_LABELS } from "@/lib/validation/vehicle";
import { qrModuleRects } from "@/lib/qr/matrix";

/**
 * Print-ready PingMyCar sticker SVGs. Deterministic rendering from the QR
 * matrix API — no canvas, no image encoding, scales cleanly to any size.
 *
 * Layout: NEED TO CONTACT / THIS VEHICLE? → QR → SCAN HERE →
 * private-message line → PingMyCar brand.
 */

const NAVY = "#0d1926";
const BLUE = "#2563eb";
const LIGHT_BLUE = "#e8effc";

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

/** Row heights/widths for the two supported sticker shapes. */
function styleFor(variant: "square" | "wide"): StickerStyle {
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
  variant: "square" | "wide" = "square",
  vehicleType?: VehicleType | null
): string {
  const s = styleFor(variant);
  const cell =
    s.qr /
    create(publicUrl, { errorCorrectionLevel: "M" }).modules.size;

  // QR dots rendered as rounded-corner squares (scannable + premium look).
  // The rect grid comes from the shared matrix renderer — same loop as the
  // bare QR, different cell size and corner radius.
  const modules = qrModuleRects(publicUrl, cell, 0.22);

  const esc = (t: string) =>
    t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const titleWeight = "font-weight:800;letter-spacing:0.12em";
  const typeLine = vehicleType ? VEHICLE_TYPE_LABELS[vehicleType] : null;

  if (variant === "square") {
    // 360 x 560
    const W = 360;
    const H = 560;
    const cx = W / 2;
    const bodyLine = "Send a private message to the vehicle owner.";
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" rx="28" fill="#ffffff"/>
  <rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="24" fill="none" stroke="${NAVY}" stroke-opacity="0.14" stroke-width="2"/>
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

  // wide — 560 x 220
  const W = 560;
  const H = 220;
  const qrY = (H - s.qr) / 2;
  const textX = s.pad + s.qr + s.gap + 16;
  const bodyLine = "Send a private message to the vehicle owner.";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" rx="24" fill="#ffffff"/>
  <rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="20" fill="none" stroke="${NAVY}" stroke-opacity="0.14" stroke-width="2"/>
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
  <text x="${textX + 104}" y="${H - s.pad - 6}" font-family="${s.font}" font-size="10" fill="${NAVY}" fill-opacity="0.5">Your contact info stays private</text>
</svg>`;
}
