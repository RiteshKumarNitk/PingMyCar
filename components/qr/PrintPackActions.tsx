"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadSvgFile, vehicleFileName } from "@/lib/qr/download";

export function PrintPackActions({
  vehicleName,
  a4Svg,
}: {
  vehicleName: string;
  a4Svg: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" onClick={() => window.print()}>
        <Printer className="h-4 w-4" aria-hidden />
        Print A4 pack
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => downloadSvgFile(a4Svg, vehicleFileName(vehicleName, "a4-sticker-pack"))}
      >
        Download A4 SVG
      </Button>
    </div>
  );
}
