import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { qrSvgMarkup, publicVehicleUrl } from "@/lib/qr";
import { stickerSvgMarkup } from "@/lib/qr/sticker";
import { ArrowRight, ChevronLeft, Lock, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VehicleQrActions } from "@/components/vehicles/VehicleQrActions";
import { QrManagement } from "@/components/vehicles/QrManagement";
import { StickerSvg } from "@/components/qr/StickerSvg";
import { QrSvg } from "@/components/qr/QrSvg";

export const metadata = { title: "QR Code" };

export default async function VehicleQrPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();

  const vehicle = await prisma.vehicle.findFirst({
    where: { id, ownerId: session.user.id },
  });
  if (!vehicle) notFound();

  const publicUrl = publicVehicleUrl(vehicle.publicToken);
  const qrSvg = qrSvgMarkup(publicUrl, 8);
  const stickerSvg = stickerSvgMarkup(publicUrl, "square", vehicle.type);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="no-print">
        <Link
          href={`/dashboard/vehicles/${vehicle.id}`}
          className="inline-flex items-center gap-1 rounded-md text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden />
          {vehicle.name}
        </Link>
        <h1 className="page-title mt-3">QR code</h1>
        <p className="supporting mt-1.5 max-w-xl">
          Print this and place it on your vehicle. Anyone who scans it can message you — without seeing your number
          or email.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* Print sheet: only this prints */}
        <div className="print-sheet overflow-hidden rounded-2xl border border-border bg-card text-center shadow-raised [print-color-adjust:exact]">
          <p className="bg-navy px-4 py-3.5 text-[0.8125rem] font-semibold tracking-[0.18em] text-white">
            SCAN TO CONTACT THE OWNER
          </p>
          <div className="px-8 pt-7 pb-6">
            <QrSvg publicUrl={publicUrl} className="mx-auto aspect-square w-52" />
            <p className="mt-5 text-sm font-semibold tracking-tight">{vehicle.name}</p>
            <p className="mx-auto mt-1.5 max-w-60 text-sm leading-snug text-muted-foreground">
              Send a message without sharing your personal information.
            </p>
          </div>
          <p className="flex items-center justify-center gap-1.5 border-t border-border py-2.5 text-xs text-muted-foreground">
            <Lock className="size-3" aria-hidden />
            Private messaging by PingMyCar
          </p>
        </div>

        <div className="no-print space-y-6">
          <section aria-labelledby="qr-status" className="surface p-5">
            <h2 id="qr-status" className="section-title">Status</h2>
            <p className="meta mt-0.5">
              Created {vehicle.createdAt.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
            <div className="mt-4">
              <QrManagement vehicleId={vehicle.id} qrActive={vehicle.qrActive} />
            </div>
            <p className="mt-4 break-all rounded-lg bg-surface-2 px-2.5 py-2 font-mono text-xs text-muted-foreground">
              {publicUrl}
            </p>
          </section>

          <section aria-labelledby="qr-downloads" className="surface p-5">
            <h2 id="qr-downloads" className="section-title">Download &amp; print</h2>
            <p className="meta mt-0.5">SVG prints crisply at any size; PNG is handy for sharing.</p>
            <div className="mt-4">
              <VehicleQrActions vehicleName={vehicle.name} qrSvg={qrSvg} stickerSvg={stickerSvg} />
            </div>
          </section>

          <section aria-labelledby="qr-sticker" className="surface p-5">
            <h2 id="qr-sticker" className="section-title">Sticker</h2>
            <p className="meta mt-0.5">The print-ready PingMyCar sticker with your QR embedded.</p>
            <div className="mt-4 flex flex-wrap items-start gap-5">
              <StickerSvg publicUrl={publicUrl} vehicleType={vehicle.type} className="w-44 max-w-none shrink-0" />
              <div className="flex flex-col gap-2">
                <Button asChild variant="outline">
                  <Link href={`/print/${vehicle.id}`}>
                    <Printer aria-hidden />
                    A4 print sheet
                  </Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/dashboard/stickers">
                    More sticker designs
                    <ArrowRight aria-hidden />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
