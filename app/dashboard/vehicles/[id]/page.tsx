import Link from "next/link";
import { notFound } from "next/navigation";
import { QrCode, MessageSquare, ScanLine } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { qrSvgMarkup, publicVehicleUrl } from "@/lib/qr";
import { STICKER_VARIANTS } from "@/lib/qr/sticker";
import { variantScanCounts } from "@/lib/qr/scanAnalytics";
import { QrSvg } from "@/components/qr/QrSvg";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/StatCard";
import { VehicleForm } from "@/components/vehicles/VehicleForm";
import { DeleteVehicleButton } from "@/components/vehicles/DeleteVehicleButton";
import { VehicleQrActions } from "@/components/vehicles/VehicleQrActions";

export const metadata = { title: "Vehicle" };

/** Server-rendered per-sticker scan breakdown — no client JS. */
function StickerScanPanel({
  counts,
  lastScanAt,
}: {
  counts: Record<string, number>;
  lastScanAt: Date | null;
}) {
  const total = Object.values(counts).reduce((n, c) => n + c, 0);
  const max = Math.max(1, ...Object.values(counts));

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="text-base">Sticker scans</CardTitle>
        <CardDescription>
          Which of your printed stickers people actually scan.
          {lastScanAt && ` Last scan ${lastScanAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">
            No sticker scans yet. Print the pack — each sticker&apos;s QR quietly tags which layout
            was scanned, so you learn where a sticker earns its place.
          </p>
        ) : (
          STICKER_VARIANTS.map((v) => (
            <div key={v.id} className="space-y-1">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium">{v.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {counts[v.id]} {counts[v.id] === 1 ? "scan" : "scans"}
                </span>
              </div>
              <div
                className="h-2 rounded-full bg-primary/85"
                style={{ width: `${Math.max(counts[v.id] > 0 ? 4 : 0, (counts[v.id] / max) * 100)}%` }}
                role="meter"
                aria-label={`${v.label}: ${counts[v.id]} scans`}
                aria-valuemin={0}
                aria-valuemax={max}
                aria-valuenow={counts[v.id]}
              />
              <p className="text-xs text-muted-foreground">{v.placement}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();

  const vehicle = await prisma.vehicle.findFirst({
    where: { id, ownerId: session.user.id },
    include: {
      _count: { select: { conversations: true } },
    },
  });
  if (!vehicle) notFound();

  const publicUrl = publicVehicleUrl(vehicle.publicToken);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Vehicle</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{vehicle.name}</h1>
          <Badge variant={vehicle.qrActive ? "success" : "warning"} className="mt-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${vehicle.qrActive ? "bg-success" : "bg-warning"}`}
              aria-hidden
            />
            {vehicle.qrActive ? "QR Active" : "QR Inactive"}
          </Badge>
        </div>
        <Button asChild variant="outline">
          <Link href={`/dashboard/vehicles/${vehicle.id}/qr`}>
            <QrCode className="h-4 w-4" aria-hidden />
            Open QR Page
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard icon={QrCode} label="QR Status" value={vehicle.qrActive ? "Active" : "Inactive"} />
        <StatCard icon={MessageSquare} label="Messages" value={vehicle._count.conversations} />
        <StatCard icon={ScanLine} label="QR Scans" value={vehicle.scanCount} />
      </div>

      <StickerScanPanel
        counts={variantScanCounts(vehicle.variantScanCounts)}
        lastScanAt={vehicle.lastScanAt}
      />

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">QR code</CardTitle>
          <CardDescription>Print this and place it on your vehicle.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <QrSvg publicUrl={publicUrl} className="aspect-square w-40 shrink-0 rounded-xl border border-border bg-white p-3" />
            <div className="min-w-0 flex-1 space-y-3">
              <p className="break-all rounded-md bg-muted px-2 py-1.5 text-xs text-muted-foreground">
                {publicUrl}
              </p>
              <VehicleQrActions vehicleName={vehicle.name} qrSvg={qrSvgMarkup(publicUrl, 8)} />
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/dashboard/vehicles/${vehicle.id}/qr`}>
                Manage QR — sticker, deactivate, regenerate
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">Contact profile</CardTitle>
          <CardDescription>
            Choose what visitors see and how they can reach you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/vehicles/${vehicle.id}/profile`}>Edit contact profile</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">Vehicle details</CardTitle>
          <CardDescription>Update your vehicle&apos;s details.</CardDescription>
        </CardHeader>
        <CardContent>
          <VehicleForm
            mode="edit"
            vehicleId={vehicle.id}
            initialValues={{
              name: vehicle.name,
              type: vehicle.type ?? "",
              registrationNumber: vehicle.registrationNumber ?? "",
              photoUrl: vehicle.photoUrl ?? "",
            }}
          />
        </CardContent>
      </Card>

      <Card className="rounded-xl border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Delete vehicle</CardTitle>
          <CardDescription>
            This removes the vehicle, its profile, and all its conversations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteVehicleButton vehicleId={vehicle.id} />
        </CardContent>
      </Card>
    </div>
  );
}
