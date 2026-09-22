import { test, expect } from "@playwright/test";
import { qrSvgMarkup } from "@/lib/qr/matrix";

test.describe("qrSvgMarkup", () => {
  test("produces an SVG that scales to its container (no fixed pixel width/height)", () => {
    const svg = qrSvgMarkup("https://pingmycar.app/v/ABC123");
    expect(svg).toContain("<svg");
    expect(svg).toContain('width="100%"');
    expect(svg).toContain('height="100%"');
    expect(svg).toMatch(/viewBox="0 0 \d+ \d+"/);
  });

  test("different input text produces different markup", () => {
    const a = qrSvgMarkup("https://pingmycar.app/v/AAAAAAAA");
    const b = qrSvgMarkup("https://pingmycar.app/v/BBBBBBBB");
    expect(a).not.toBe(b);
  });
});
