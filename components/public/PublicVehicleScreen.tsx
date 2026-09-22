import { notFound } from "next/navigation";
import { Car, Lock } from "lucide-react";
import { prisma } from "@/lib/db";
import { buildPublicVehicleView } from "@/lib/publicVehicleView";
import { Logo } from "@/components/shared/Logo";
import { VehiclePublicCard } from "@/components/vehicles/VehiclePublicCard";
import { StartConversationForm } from "@/components/public/StartConversationForm";

/**
 * The complete visitor experience for one vehicle. Shared by /v/<token> (what
 * QR stickers encode) and /vehicle/<code> (the spec-named alias). Renders only
 * what the owner's privacy toggles expose — never owner contact details.
 */
export async function PublicVehicleScreen({ token }: { token: string }) {
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
        <Logo />
        <div className="mt-10 w-full max-w-sm rounded-2xl border border-border bg-card p-8">
          <p className="text-lg font-semibold">This QR code is no longer active.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            The owner has turned off contact for this vehicle.
          </p>
        </div>
      </div>
    );
  }

  // Count the scan (fire-and-forget — never block or fail the page).
  prisma.vehicle
    .update({ where: { id: vehicle.id }, data: { scanCount: { increment: 1 } } })
    .catch(() => {});

  const view = buildPublicVehicleView(vehicle, vehicle.profile, vehicle.owner);
  const maxChars = Number(process.env.MESSAGE_MAX_CHARS ?? 500);

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-md items-center justify-center px-4">
          <Logo />
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-8">
        <div className="text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Car className="h-8 w-8" aria-hidden />
          </span>
          <h1 className="mt-4 text-xl font-bold tracking-tight">
            You are contacting this vehicle
          </h1>
          {(view.vehicleName || view.registrationNumber) && (
            <p className="mt-1 text-sm text-muted-foreground">
              {view.vehicleName}
              {view.vehicleName && view.registrationNumber ? " · " : ""}
              {view.registrationNumber}
            </p>
          )}
        </div>

        <div className="mt-6">
          {/* Vehicle identity lives in the page header above — the card adds
              only what the owner opted into beyond that (their name/photo)
              plus the contact form. */}
          <VehiclePublicCard
            vehicleName={null}
            vehicleType={null}
            vehiclePhotoUrl={null}
            registrationNumber={null}
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

        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Your contact information is not shared with the vehicle owner.
        </p>
      </main>
    </div>
  );
}
