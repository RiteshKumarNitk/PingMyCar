"use client";

import { useState } from "react";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadSvgFile, downloadSvgAsPng, vehicleFileName } from "@/lib/qr/download";

export function VehicleQrActions({
  vehicleName,
  qrSvg,
  stickerSvg,
  stickers,
  compact = false,
}: {
  vehicleName: string;
  qrSvg: string;
  stickerSvg?: string;
  stickers?: { suffix: string; svg: string; label: string }[];
  compact?: boolean;
}) {
  const [pngBusy, setPngBusy] = useState(false);
  const [pngError, setPngError] = useState<string | null>(null);
  const extras = stickers ?? (stickerSvg ? [{ suffix: "sticker", svg: stickerSvg, label: "Download Sticker" }] : []);

  return (
    <div className={compact ? "flex flex-col gap-2" : "flex flex-wrap gap-2"}>
      <Button
        type="button"
        variant="outline"
        onClick={() => downloadSvgFile(qrSvg, vehicleFileName(vehicleName, "qr"))}
      >
        <Download className="h-4 w-4" aria-hidden />
        Download QR (SVG)
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={pngBusy}
        onClick={() => {
          setPngError(null);
          setPngBusy(true);
          downloadSvgAsPng(qrSvg, vehicleFileName(vehicleName, "qr"), 1024)
            .catch((err: unknown) => {
              setPngError(
                err instanceof Error && err.message
                  ? err.message
                  : "PNG download failed. Try the SVG download instead."
              );
            })
            .finally(() => setPngBusy(false));
        }}
      >
        <Download className="h-4 w-4" aria-hidden />
        {pngBusy ? "Preparing…" : "Download PNG"}
      </Button>
      {pngError && (
        <p role="alert" className="w-full text-sm text-destructive">
          {pngError}
        </p>
      )}
      {extras.map((item) => (
        <Button
          key={item.suffix}
          type="button"
          variant="outline"
          onClick={() => downloadSvgFile(item.svg, vehicleFileName(vehicleName, item.suffix))}
        >
          <Download className="h-4 w-4" aria-hidden />
          {item.label}
        </Button>
      ))}
      <Button type="button" variant="outline" onClick={() => window.print()}>
        <Printer className="h-4 w-4" aria-hidden />
        Print
      </Button>
    </div>
  );
}
