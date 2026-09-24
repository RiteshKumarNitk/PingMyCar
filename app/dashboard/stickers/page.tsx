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
import { STICKER_VARIANTS, stickerSvgMarkup } from "@/lib/qr/sticker";
import { publicVehicleUrl, qrSvgMarkup } from "@/lib/qr";

export const metadata = { title: "Stickers" };

const PLACEMENTS = [
  "Rear windshield — window vinyl",
  "Bumper or plate surround — strip",
  "Side window or helmet — round badge",
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
        description="Each vehicle has its own QR. Download the vinyl layouts that look like real car stickers."
        action={
          <Button asChild>
            <Link href="/dashboard/vehicles/new">Add another vehicle QR</Link>
          </Button>
        }
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
        <div className="space-y-8">
          {vehicles.map((vehicle) => {
            const publicUrl = publicVehicleUrl(vehicle.publicToken);
            const stickers = STICKER_VARIANTS.map((v) => ({
              suffix: v.id === "square" ? "sticker" : `sticker-${v.id}`,
              svg: stickerSvgMarkup(publicUrl, v.id, vehicle.type),
              label: v.id === "square" ? "Download Sticker" : `Download ${v.label}`,
            }));
            return (
              <Card key={vehicle.id} className="rounded-xl">
                <CardHeader>
                  <CardTitle className="text-base">{vehicle.name}</CardTitle>
                  <CardDescription>
                    One unique QR · three print cuts · token {vehicle.publicToken}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 lg:grid-cols-3">
                    {STICKER_VARIANTS.map((v) => (
                      <div key={v.id} className="space-y-2">
                        <div className="flex min-h-[280px] items-center justify-center rounded-xl bg-[#1a2330] p-5">
                          <StickerSvg
                            publicUrl={publicUrl}
                            variant={v.id}
                            vehicleType={vehicle.type}
                            className={v.id === "wide" ? "w-full max-w-none" : "w-44 max-w-none"}
                          />
                        </div>
                        <p className="text-center text-xs font-medium">{v.label}</p>
                        <p className="text-center text-xs text-muted-foreground">{v.placement}</p>
                      </div>
                    ))}
                  </div>
                  <VehicleQrActions
                    vehicleName={vehicle.name}
                    qrSvg={qrSvgMarkup(publicUrl, 8)}
                    stickers={stickers}
                  />
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button asChild className="flex-1">
                      <Link href={`/print/${vehicle.id}`}>Print A4 sticker pack</Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm" className="flex-1">
                      <Link href={`/dashboard/vehicles/${vehicle.id}/qr`}>Open QR page</Link>
                    </Button>
                  </div>
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
