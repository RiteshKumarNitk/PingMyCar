import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { qrSvgMarkup, publicVehicleUrl } from "@/lib/qr";
import { stickerSvgMarkup } from "@/lib/qr/sticker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="no-print">
        <Link
          href={`/dashboard/vehicles/${vehicle.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {vehicle.name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Your PingMyCar QR</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Download, print, and place this on your vehicle — then anyone can reach you
          about it.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Print sheet: only this prints */}
        <div className="print-sheet rounded-2xl border border-border bg-card p-6 text-center">
          <QrSvg publicUrl={publicUrl} className="mx-auto aspect-square w-56" />
          <p className="mt-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {vehicle.name}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Scan to contact the owner of this vehicle — no phone number shared.
          </p>
        </div>

        <div className="no-print space-y-6">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="text-base">Status</CardTitle>
              <CardDescription>
                Created {vehicle.createdAt.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QrManagement vehicleId={vehicle.id} qrActive={vehicle.qrActive} />
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="text-base">Downloads</CardTitle>
              <CardDescription>SVG prints crisply at any size; PNG for quick sharing.</CardDescription>
            </CardHeader>
            <CardContent>
              <VehicleQrActions
                vehicleName={vehicle.name}
                qrSvg={qrSvg}
                stickerSvg={stickerSvg}
              />
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="text-base">Sticker</CardTitle>
              <CardDescription>
                The print-ready PingMyCar sticker design with your QR embedded.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <StickerSvg publicUrl={publicUrl} vehicleType={vehicle.type} className="w-56 max-w-none" />
              <p className="break-all rounded-md bg-muted px-2 py-1.5 text-xs text-muted-foreground">
                {publicUrl}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
