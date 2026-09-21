import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { buildPublicVehicleView } from "@/lib/publicVehicleView";
import { VehiclePublicCard } from "@/components/vehicles/VehiclePublicCard";
import { StartConversationForm } from "@/components/public/StartConversationForm";

export default async function PublicVehiclePage({ params }: { params: Promise<{ publicToken: string }> }) {
  const { publicToken } = await params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { publicToken },
    include: {
      profile: true,
      owner: { select: { name: true, preferredName: true, image: true, phoneNumber: true } },
    },
  });

  if (!vehicle || !vehicle.profile) notFound();

  if (!vehicle.qrActive) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center px-4 text-center">
        <p className="text-lg font-semibold">This QR code is no longer active.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          The owner has turned off messages for this vehicle.
        </p>
      </div>
    );
  }

  const view = buildPublicVehicleView(vehicle, vehicle.profile, vehicle.owner);
  const maxChars = Number(process.env.MESSAGE_MAX_CHARS ?? 500);

  return (
    <div className="mx-auto min-h-dvh max-w-sm px-4 py-10">
      <VehiclePublicCard
        vehicleName={view.vehicleName}
        vehicleType={view.vehicleType}
        vehiclePhotoUrl={view.vehiclePhotoUrl}
        registrationNumber={view.registrationNumber}
        ownerDisplayName={view.ownerName}
        ownerPhotoUrl={view.ownerPhotoUrl}
        contactFlags={view.contact}
        contactSection={
          <StartConversationForm publicToken={publicToken} contactFlags={view.contact} maxChars={maxChars} />
        }
      />
    </div>
  );
}
