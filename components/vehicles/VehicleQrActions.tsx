"use client";

import { useState } from "react";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadSvgFile, downloadSvgAsPng, vehicleFileName } from "@/lib/qr/download";

/**
 * Download/print actions for a vehicle's QR and sticker. Pure actions — no
 * state changes — so it can live on the onboarding success page, the QR page,
 * and the vehicle detail page alike.
 */
export function VehicleQrActions({
  vehicleName,
  qrSvg,
  stickerSvg,
  compact = false,
}: {
  vehicleName: string;
  qrSvg: string;
  stickerSvg?: string;
  compact?: boolean;
}) {
  const [pngBusy, setPngBusy] = useState(false);
  const [pngError, setPngError] = useState<string | null>(null);

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
        <p role="alert" className="w-full text-sm text-destructive">{pngError}</p>
      )}
      {stickerSvg && (
        <Button
          type="button"
          variant="outline"
          onClick={() => downloadSvgFile(stickerSvg, vehicleFileName(vehicleName, "sticker"))}
        >
          <Download className="h-4 w-4" aria-hidden />
          Download Sticker
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        onClick={() => window.print()}
      >
        <Printer className="h-4 w-4" aria-hidden />
        Print
      </Button>
    </div>
  );
}
