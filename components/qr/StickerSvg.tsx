import type { VehicleType } from "@prisma/client";
import { stickerSvgMarkup, type StickerVariant } from "@/lib/qr/sticker";

export function StickerSvg({
  publicUrl,
  variant = "square",
  vehicleType,
  className = "w-full max-w-[320px]",
}: {
  publicUrl: string;
  variant?: StickerVariant;
  vehicleType?: VehicleType | null;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label="PingMyCar QR sticker"
      className={`${className} [&>svg]:h-auto [&>svg]:w-full drop-shadow-md`}
      dangerouslySetInnerHTML={{ __html: stickerSvgMarkup(publicUrl, variant, vehicleType) }}
    />
  );
}
