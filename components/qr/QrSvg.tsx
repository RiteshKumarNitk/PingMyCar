import { qrSvgMarkup } from "@/lib/qr/matrix";

/**
 * Renders a vehicle QR code inline. Server component — the SVG markup is
 * generated on the server and embedded directly (no client JS, no image).
 * Single renderer for every bare-QR site: onboarding ready, vehicle detail,
 * and the QR management page.
 */
export function QrSvg({ publicUrl, className = "w-full" }: { publicUrl: string; className?: string }) {
  return (
    <div
      role="img"
      aria-label="QR code linking to your vehicle's contact page"
      className={`${className} [&>svg]:h-auto [&>svg]:w-full`}
      dangerouslySetInnerHTML={{ __html: qrSvgMarkup(publicUrl, 8) }}
    />
  );
}
