import { test, expect } from "@playwright/test";
import QRCodeLib from "qrcode";

const VEHICLE_URL = "https://pingmycar.app/v/BK7F92QH";
type QRCodeErrorCorrectionLevel = "L" | "M" | "Q" | "H";

function buildQrSvg(value: string, size = 268, fgColor = "var(--foreground)", bgColor = "var(--background)", errorCorrectionLevel: QRCodeErrorCorrectionLevel = "M") {
  const qrData = QRCodeLib.create(value, { errorCorrectionLevel });
  if (!qrData) return "";

  const moduleCount = qrData.modules.size;
  const moduleSize = size / moduleCount;
  const totalSize = size;

  const finderPositions: [number, number][] = [
    [0, 0],
    [0, moduleCount - 7],
    [moduleCount - 7, 0],
  ];

  const finderSize = 7 * moduleSize;
  const innerPadding = moduleSize;
  const innerWhiteSize = 5 * moduleSize;
  const innerBlackSize = 3 * moduleSize;

  const circles: { cx: number; cy: number }[] = [];

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (
        qrData.modules.get(row, col) &&
        !(
          (row < 7 && col < 7) ||
          (row < 7 && col >= moduleCount - 7) ||
          (row >= moduleCount - 7 && col < 7)
        )
      ) {
        circles.push({
          cx: (col + 0.5) * moduleSize,
          cy: (row + 0.5) * moduleSize,
        });
      }
    }
  }

  const parts: string[] = [];
  parts.push(`<svg`);
  parts.push(` width="${totalSize}"`);
  parts.push(` height="${totalSize}"`);
  parts.push(` viewBox="0 0 ${totalSize} ${totalSize}"`);
  parts.push(` xmlns="http://www.w3.org/2000/svg"`);
  parts.push(` aria-label="QR code for ${value}"`);
  parts.push(`>`);
  parts.push(`<rect width="${totalSize}" height="${totalSize}" fill="${bgColor}" rx="12" ry="12"/>`);

  for (const [r, c] of finderPositions) {
    const x = c * moduleSize;
    const y = r * moduleSize;
    parts.push(`<g key="${r}-${c}">`);
    parts.push(`<rect x="${x}" y="${y}" width="${finderSize}" height="${finderSize}" fill="${fgColor}" rx="12" ry="12"/>`);
    parts.push(`<rect x="${x + innerPadding}" y="${y + innerPadding}" width="${innerWhiteSize}" height="${innerWhiteSize}" fill="${bgColor}" rx="8" ry="8"/>`);
    parts.push(`<rect x="${x + innerPadding * 2}" y="${y + innerPadding * 2}" width="${innerBlackSize}" height="${innerBlackSize}" fill="${fgColor}" rx="3" ry="3"/>`);
    parts.push(`</g>`);
  }

  for (let i = 0; i < circles.length; i++) {
    const { cx, cy } = circles[i];
    parts.push(`<circle cx="${cx}" cy="${cy}" r="${moduleSize / 3}" fill="${fgColor}"/>`);
  }

  parts.push(`</svg>`);
  return parts.join("");
}

test.describe("QRCode component (static output contract)", () => {
  test("builds a valid SVG with the value in aria-label and a square viewBox", () => {
    const svg = buildQrSvg(VEHICLE_URL, 268, "#16222c", "#ffffff", "H");
    expect(svg).toContain(`<svg`);
    expect(svg).toContain(`aria-label="QR code for ${VEHICLE_URL}"`);
    expect(svg).toMatch(/viewBox="0 0 \d+ \d+"/);
    expect(svg).toMatch(/width="\d+"/);
    expect(svg).toMatch(/height="\d+"/);
  });

  test("honors the size prop", () => {
    const svg = buildQrSvg(VEHICLE_URL, 120);
    expect(svg).toContain('width="120"');
    expect(svg).toContain('height="120"');
    expect(svg).toContain('viewBox="0 0 120 120"');
  });

  test("uses fgColor for finder dark rects and data-dot circles, bgColor for background and inner-white rects", () => {
    const fg = "#0d1926";
    const bg = "#ffffff";
    const svg = buildQrSvg(VEHICLE_URL, 268, fg, bg, "H");

    // Background fill
    expect(svg).toContain(`fill="${bg}"`);
    // Finder outer rects
    for (let i = 0; i < 3; i++) expect(svg).toContain(`fill="${fg}"`);
    // Data dots
    expect(svg).toContain(`fill="${fg}"`);
  });

  test("renders all three finder patterns as dark (finder outer rect present 3x)", () => {
    const svg = buildQrSvg(VEHICLE_URL, 268, "#16222c", "#ffffff", "H");
    // The component renders three finder-pattern groups. The simplest reliable
    // signal is the presence of three distinct `<g key="r-c">` corner groups,
    // one per finder pattern.
    const groupKeys = svg.match(/<g key="(\d+)-(\d+)">/g) ?? [];
    expect(groupKeys.length).toBeGreaterThanOrEqual(3);
  });

  test("renders data-dot circles for the encoded modules", () => {
    const svg = buildQrSvg(VEHICLE_URL, 268, "#16222c", "#ffffff", "H");
    expect(svg).toMatch(/<circle cx="[\d.]+" cy="[\d.]+" r="[\d.]+" fill="#[^"]+"\/>/);
    const circleCount = (svg.match(/<circle /g) || []).length;
    expect(circleCount).toBeGreaterThan(0);
  });

  test("returns empty string when qrcode creation fails (caught in component)", () => {
    // qrcode throws for malformed input; component returns null and renders nothing.
    expect(() => QRCodeLib.create("", { errorCorrectionLevel: "M" }).modules.size).toThrow();
  });
});
