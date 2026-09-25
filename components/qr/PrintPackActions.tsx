"use client";

import { useState } from "react";
import { Download, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { vehicleFileName } from "@/lib/qr/download";
import { buildA4StickerPackPdf } from "@/lib/qr/a4Pdf";
import { STICKER_PRINT_MM, type StickerVariant } from "@/lib/qr/sticker";

/**
 * A4 print-pack actions. Rasterizes each sticker SVG to a high-DPI PNG in
 * the browser (same markup as the dashboard preview), then assembles the
 * real A4 PDF server-side in the browser via pdf-lib — physical mm units,
 * vector crop marks, and print instructions.
 */

/** Rasterize an SVG string to PNG bytes at a given pixel width. */
async function svgToPngBytes(svgMarkup: string, widthPx: number): Promise<Uint8Array> {
  const blob = new Blob([svgMarkup], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Sticker rasterization failed in this browser."));
      img.src = url;
    });
    const ratio = img.width && img.height ? img.height / img.width : 1;
    const canvas = document.createElement("canvas");
    canvas.width = widthPx;
    canvas.height = Math.round(widthPx * ratio);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas isn't available in this browser.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!pngBlob) throw new Error("PNG encoding failed in this browser.");
    return new Uint8Array(await pngBlob.arrayBuffer());
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function PrintPackActions({
  vehicleName,
  stickerSvgs,
}: {
  vehicleName: string;
  /** Full sticker SVG markup per variant, from stickerSvgMarkup. */
  stickerSvgs: { variant: StickerVariant; svg: string }[];
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function downloadPdf() {
    setError(null);
    setPending(true);
    try {
      // High DPI: 50 mm at ~600 px ≈ 300 DPI — crisp QR modules on paper.
      const stickerPngs = await Promise.all(
        stickerSvgs.map(async ({ variant, svg }) => ({
          variant,
          bytes: await svgToPngBytes(svg, Math.round(STICKER_PRINT_MM[variant].w * 12)),
        }))
      );
      const pdfBytes = await buildA4StickerPackPdf(vehicleName, stickerPngs);
      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${vehicleFileName(vehicleName, "a4-sticker-pack")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't generate the PDF. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" onClick={() => window.print()}>
        <Printer className="h-4 w-4" aria-hidden />
        Preview Print Layout
      </Button>
      <Button type="button" variant="outline" onClick={downloadPdf} disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Download className="h-4 w-4" aria-hidden />}
        Download A4 PDF
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
