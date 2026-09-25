import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { buildPublicVehicleView } from "@/lib/publicVehicleView";
import { parseVariantScanParam, recordVariantScan } from "@/lib/qr/scanAnalytics";
import { Logo } from "@/components/shared/Logo";
import { VehiclePublicCard } from "@/components/vehicles/VehiclePublicCard";
import { StartConversationForm } from "@/components/public/StartConversationForm";
import type { VehicleType } from "@prisma/client";

export async function PublicVehicleScreen({
  token,
  variantParam,
}: {
  token: string;
  variantParam?: string | string[];
}) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { publicToken: token },
    include: {
      profile: true,
      owner: { select: { name: true, preferredName: true, image: true, phoneNumber: true } },
    },
  });

  if (!vehicle || !vehicle.profile) notFound();

  if (!vehicle.qrActive) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
        <Logo linked={false} />
        <div className="mt-8 w-full max-w-sm rounded-2xl border border-border bg-card p-8">
          <p className="text-xl font-semibold">This QR is no longer active.</p>
          <p className="mt-2 text-base text-muted-foreground">
            The owner has turned off contact for this vehicle.
          </p>
        </div>
      </div>
    );
  }

  prisma.vehicle
    .update({ where: { id: vehicle.id }, data: { scanCount: { increment: 1 }, lastScanAt: new Date() } })
    .catch(() => {});

  // Per-sticker analytics: only visits that arrived from a sticker's tagged
  // QR (?s=<variant>) count here — bare scans stay anonymous.
  const variant = parseVariantScanParam(Array.isArray(variantParam) ? variantParam[0] : variantParam);
  if (variant) {
    recordVariantScan(vehicle.id, variant).catch(() => {});
  }

  const view = buildPublicVehicleView(vehicle, vehicle.profile, vehicle.owner);
  const maxChars = Number(process.env.MESSAGE_MAX_CHARS ?? 500);

  return (
    <div className="min-h-dvh bg-background">
      <header className="px-4 pt-5">
        <div className="mx-auto flex max-w-md justify-center">
          <Logo linked={false} compact />
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pb-10 pt-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">This is not an emergency service.</p>
          <p className="mt-1 leading-snug">
            If someone is hurt or in danger, call your local emergency number now.
          </p>
        </div>

        <h1 className="mt-5 text-center text-2xl font-bold tracking-tight">
          Contact this vehicle
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          No app. No login. The owner will not see your number.
        </p>

        <div className="mt-5">
          <VehiclePublicCard
            vehicleName={view.vehicleName}
            vehicleType={view.vehicleType as VehicleType | null}
            vehiclePhotoUrl={view.vehiclePhotoUrl}
            registrationNumber={view.registrationNumber}
            ownerDisplayName={view.ownerName}
            ownerPhotoUrl={view.ownerPhotoUrl}
            contactFlags={view.contact}
            contactSection={
              <StartConversationForm
                publicToken={token}
                contactFlags={view.contact}
                maxChars={maxChars}
              />
            }
          />
        </div>
      </main>
    </div>
  );
}
