import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Sticker, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { StickerSvg } from "@/components/qr/StickerSvg";
import { VehicleQrActions } from "@/components/vehicles/VehicleQrActions";
import { stickerSvgMarkup } from "@/lib/qr/sticker";
import { publicVehicleUrl, qrSvgMarkup } from "@/lib/qr";

export const metadata = { title: "Stickers" };

const PLACEMENTS = [
  "Rear windshield",
  "Rear side window",
  "Visible bumper area",
  "Motorcycle/scooter visible area",
];

export default async function StickersPage() {
  const session = await requireSession();
  const vehicles = await prisma.vehicle.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stickers"
        description="Download print-ready PingMyCar stickers for each of your vehicles."
      />

      {vehicles.length === 0 ? (
        <EmptyState
          icon={Sticker}
          title="No vehicles yet."
          description="Add a vehicle first — its sticker files live here."
          ctaLabel="Add Vehicle"
          ctaHref="/dashboard/vehicles/new"
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {vehicles.map((vehicle) => {
            const publicUrl = publicVehicleUrl(vehicle.publicToken);
            const stickerSvg = stickerSvgMarkup(publicUrl, "square", vehicle.type);
            return (
              <Card key={vehicle.id} className="rounded-xl">
                <CardHeader>
                  <CardTitle className="text-base">{vehicle.name}</CardTitle>
                  <CardDescription>
                    Square format · QR large enough to scan reliably
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-center rounded-xl bg-muted/40 p-6">
                    <StickerSvg publicUrl={publicUrl} vehicleType={vehicle.type} className="w-48 max-w-none" />
                  </div>
                  <VehicleQrActions
                    vehicleName={vehicle.name}
                    qrSvg={qrSvgMarkup(publicUrl, 8)}
                    stickerSvg={stickerSvg}
                  />
                  <Button asChild variant="ghost" size="sm" className="w-full">
                    <Link href={`/dashboard/vehicles/${vehicle.id}/qr`}>Open QR page</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">Recommended placement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-1.5 text-sm">
            {PLACEMENTS.map((p) => (
              <li key={p} className="flex items-center gap-2">
                <span className="text-success" aria-hidden>
                  ✓
                </span>
                {p}
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            Make sure the QR is visible and can be scanned without entering the vehicle.
          </p>
          <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            Follow local vehicle and road-safety regulations when placing stickers.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
