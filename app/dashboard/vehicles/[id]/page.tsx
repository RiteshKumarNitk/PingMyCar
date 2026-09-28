import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink, QrCode, MessageSquare, ScanLine } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { qrSvgMarkup, publicVehicleUrl } from "@/lib/qr";
import { STICKER_VARIANTS } from "@/lib/qr/sticker";
import { variantScanCounts } from "@/lib/qr/scanAnalytics";
import { QrSvg } from "@/components/qr/QrSvg";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
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
    <Card>
      <CardHeader>
        <CardTitle>Sticker scans</CardTitle>
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
      <div>
        <Link
          href="/dashboard/vehicles"
          className="inline-flex items-center gap-1 rounded-md text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Vehicles
        </Link>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="eyebrow">Vehicle</p>
            <h1 className="page-title mt-1.5 truncate">{vehicle.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {vehicle.registrationNumber && (
                <span className="rounded-md border border-foreground/15 bg-surface-2 px-1.5 py-0.5 font-mono text-xs font-semibold uppercase tracking-[0.12em]">
                  {vehicle.registrationNumber}
                </span>
              )}
              <StatusBadge status={vehicle.qrActive ? "active" : "inactive"} label={vehicle.qrActive ? "QR active" : "QR off"} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={`/dashboard/vehicles/${vehicle.id}/qr`}>
                <QrCode aria-hidden />
                Open QR Page
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/dashboard/messages?vehicle=${vehicle.id}`}>
                <MessageSquare aria-hidden />
                Messages
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/v/${vehicle.publicToken}`} target="_blank" rel="noopener">
                <ExternalLink aria-hidden />
                Public page
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard icon={MessageSquare} label="Conversations" value={vehicle._count.conversations} tone="comm" />
        <StatCard icon={ScanLine} label="QR scans" value={vehicle.scanCount} />
        <StatCard icon={QrCode} label="QR status" value={vehicle.qrActive ? "On" : "Off"} tone={vehicle.qrActive ? "success" : "primary"} />
      </div>

      <StickerScanPanel
        counts={variantScanCounts(vehicle.variantScanCounts)}
        lastScanAt={vehicle.lastScanAt}
      />

      <Card>
        <CardHeader>
          <CardTitle>QR code</CardTitle>
          <CardDescription>Print this and place it on your vehicle.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <QrSvg publicUrl={publicUrl} className="aspect-square w-40 shrink-0 rounded-xl border border-border bg-white p-3 shadow-card" />
            <div className="min-w-0 flex-1 space-y-3">
              <p className="break-all rounded-lg bg-surface-2 px-2.5 py-2 font-mono text-xs text-muted-foreground">
                {publicUrl}
              </p>
              <VehicleQrActions vehicleName={vehicle.name} qrSvg={qrSvgMarkup(publicUrl, 8)} />
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/dashboard/vehicles/${vehicle.id}/qr`}>
                Manage QR &amp; stickers
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact profile</CardTitle>
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

      <Card>
        <CardHeader>
          <CardTitle>Vehicle details</CardTitle>
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

      <Card className="border-danger/25 bg-danger-bg/30">
        <CardHeader>
          <CardTitle className="text-danger">Delete vehicle</CardTitle>
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
