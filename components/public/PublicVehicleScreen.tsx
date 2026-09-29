import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { buildPublicVehicleView } from "@/lib/publicVehicleView";
import { parseVariantScanParam, recordVariantScan } from "@/lib/qr/scanAnalytics";
import { Lock, QrCode, TriangleAlert } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { VehiclePublicCard } from "@/components/vehicles/VehiclePublicCard";
import { StartConversationForm } from "@/components/public/StartConversationForm";
import type { VehicleType } from "@prisma/client";
import { demoPublicView, DEMO_INACTIVE_TOKEN, isDemoPublicToken } from "@/lib/guest/demo";
import type { ContactFlags } from "@/types";

export async function PublicVehicleScreen({
  token,
  variantParam,
}: {
  token: string;
  variantParam?: string | string[];
}) {
  // Demo QR codes (website demos, Play reviewer) never touch the database or
  // reach a real owner: the page renders static demo data and the send is
  // simulated in the browser.
  if (isDemoPublicToken(token)) {
    return token === DEMO_INACTIVE_TOKEN ? <InactiveQr /> : <VehicleContactPage view={demoPublicView()} token={token} demo />;
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: { publicToken: token },
    include: {
      profile: true,
      owner: { select: { name: true, preferredName: true, image: true, phoneNumber: true } },
    },
  });

  if (!vehicle || !vehicle.profile) notFound();

  if (!vehicle.qrActive) return <InactiveQr />;

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

  return <VehicleContactPage view={view} token={token} />;
}

function InactiveQr() {
  return (
      <div className="flex min-h-dvh flex-col bg-background">
        <header className="bg-navy px-4 py-5">
          <div className="mx-auto flex max-w-md justify-center">
            <Logo linked={false} inverse />
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-surface-2 text-muted-foreground">
            <QrCode className="size-7" strokeWidth={1.75} aria-hidden />
          </span>
          <h1 className="page-title mt-5">This QR is no longer active.</h1>
          <p className="supporting mt-2 max-w-xs">
            The owner has turned off contact for this vehicle, so messages can&apos;t be sent from this code.
          </p>
        </main>
      </div>
  );
}

type ContactView = {
  vehicleName: string | null;
  vehicleType: string | null;
  vehiclePhotoUrl: string | null;
  registrationNumber: string | null;
  ownerName: string | null;
  ownerPhotoUrl: string | null;
  contact: ContactFlags;
};

function VehicleContactPage({ view, token, demo = false }: { view: ContactView; token: string; demo?: boolean }) {
  const maxChars = Number(process.env.MESSAGE_MAX_CHARS ?? 500);
  return (
    <div className="min-h-dvh bg-background">
      <header className="bg-navy text-white">
        <div className="mx-auto max-w-md px-4 pb-20 pt-5">
          <div className="flex items-center justify-between">
            <Logo linked={false} inverse />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80">
              <Lock className="size-3" aria-hidden />
              Private contact
            </span>
          </div>
          <h1 className="mt-8 text-[1.625rem] font-semibold leading-tight tracking-tight">
            Connect with the vehicle owner
          </h1>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-white/70">
            Connect with the owner without sharing personal information. No app or login needed.
          </p>
        </div>
      </header>

      <main className="mx-auto -mt-14 max-w-md px-4 pb-10">
        {demo && (
          <div role="note" className="mb-3 rounded-xl border border-primary/30 bg-primary-soft px-4 py-3 text-sm text-foreground">
            <span className="font-semibold">Demo QR.</span> This is OwnerPing&apos;s sample vehicle — messages
            sent here are simulated and never reach a real owner.
          </div>
        )}
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
              demo={demo}
            />
          }
        />

        <div role="note" className="mt-4 flex gap-3 rounded-xl bg-warning-bg px-4 py-3 text-sm text-warning">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p className="leading-snug">
            <span className="font-semibold">Not an emergency service.</span> If someone is hurt or in danger,
            call your local emergency number now.
          </p>
        </div>

        <p className="meta mt-6 text-center">Messages are delivered privately through OwnerPing.</p>
      </main>
    </div>
  );
}
