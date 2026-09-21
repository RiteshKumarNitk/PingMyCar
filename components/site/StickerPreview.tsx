import Link from "next/link";
import { create as createQr } from "qrcode";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

const STICKER_URL = "https://pingmycar.app/v/X7K92P8Q";

/** Server-rendered QR matrix — no client JS, crisp at any size. */
function Matrix({ text, cell = 7 }: { text: string; cell?: number }) {
  const qr = createQr(text, { errorCorrectionLevel: "M" });
  const size = qr.modules.size;
  const data = qr.modules.data;
  const cells: ReactNode[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (data[r * size + c]) {
        cells.push(
          <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} />
        );
      }
    }
  }
  return (
    <svg
      role="img"
      aria-label="Example QR code sticker"
      viewBox={`0 0 ${size * cell} ${size * cell}`}
      className="h-auto w-full"
      shapeRendering="crispEdges"
    >
      <rect width={size * cell} height={size * cell} fill="#ffffff" />
      <g fill="#16222c">{cells}</g>
    </svg>
  );
}

export function StickerPreview() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            One sticker. One link. Zero exposure.
          </h2>
          <p className="mt-4 max-w-lg text-lg text-muted-foreground">
            Every vehicle gets its own QR code and its own private contact
            page. Print it, stick it inside a window or on the bumper, and
            you&apos;re reachable — on your terms.
          </p>
          <p className="mt-3 max-w-lg text-sm text-muted-foreground">
            You can deactivate or regenerate the QR at any time, for any
            vehicle.
          </p>
          <Button asChild size="lg" className="mt-8 h-12 px-7 text-base">
            <Link href="/signup">Create My QR</Link>
          </Button>
        </div>

        <div className="flex justify-center">
          <div className="relative">
            {/* Realistic sticker card */}
            <div className="w-64 rounded-[1.4rem] border border-border bg-white p-6 text-center shadow-[0_20px_50px_-20px_rgba(22,34,44,0.45)] sm:w-72">
              <div className="rounded-xl bg-slate-900 px-3 py-2 text-[11px] font-semibold tracking-wide text-slate-100">
                NEED TO CONTACT ME?
              </div>
              <div className="mx-auto mt-4 w-full max-w-[180px] rounded-lg border border-slate-200 p-2">
                <Matrix text={STICKER_URL} />
              </div>
              <p className="mt-3 text-sm font-medium text-slate-800">
                Scan to send a message
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Your number stays private
              </p>
            </div>
            <div className="absolute -right-3 -top-3 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow">
              Physical sticker
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
