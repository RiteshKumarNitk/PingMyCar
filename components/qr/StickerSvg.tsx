import { stickerSvgMarkup } from "@/lib/qr/sticker";
import type { VehicleType } from "@prisma/client";

/**
 * Renders a PingMyCar sticker inline. Server component — the SVG markup is
 * generated on the server and embedded directly (no client JS, no image).
 * The generated SVG carries fixed width/height attributes, so the wrapper
 * forces it to scale responsively.
 */
export function StickerSvg({
  publicUrl,
  variant = "square",
  vehicleType,
  className = "w-full max-w-[320px]",
}: {
  publicUrl: string;
  variant?: "square" | "wide";
  vehicleType?: VehicleType | null;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label="PingMyCar QR sticker"
      className={`${className} [&>svg]:h-auto [&>svg]:w-full`}
      dangerouslySetInnerHTML={{ __html: stickerSvgMarkup(publicUrl, variant, vehicleType) }}
    />
  );
}
