import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { VehicleProfileForm } from "@/components/vehicles/VehicleProfileForm";

export const metadata = { title: "Contact Profile" };

export default async function VehicleProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();

  const vehicle = await prisma.vehicle.findFirst({
    where: { id, ownerId: session.user.id },
    include: { profile: true },
  });
  if (!vehicle?.profile) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">{vehicle.name} — Contact profile</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Choose what visitors see when they scan your QR, and how they can reach you.
      </p>

      <div className="mt-8">
        <VehicleProfileForm
          vehicle={{
            id: vehicle.id,
            name: vehicle.name,
            type: vehicle.type,
            photoUrl: vehicle.photoUrl,
            registrationNumber: vehicle.registrationNumber,
          }}
          toggles={{
            showVehicleName: vehicle.profile.showVehicleName,
            showVehicleType: vehicle.profile.showVehicleType,
            showVehiclePhoto: vehicle.profile.showVehiclePhoto,
            showRegistrationNumber: vehicle.profile.showRegistrationNumber,
            showOwnerName: vehicle.profile.showOwnerName,
            showOwnerPhoto: vehicle.profile.showOwnerPhoto,
            showPreferredName: vehicle.profile.showPreferredName,
            allowMessages: vehicle.profile.allowMessages,
            allowParkingAlerts: vehicle.profile.allowParkingAlerts,
            allowVehicleIssues: vehicle.profile.allowVehicleIssues,
            allowDamageReports: vehicle.profile.allowDamageReports,
            allowEmergencyAlerts: vehicle.profile.allowEmergencyAlerts,
          }}
          owner={{
            name: session.user.name,
            preferredName: session.user.preferredName ?? null,
            image: session.user.image ?? null,
            phoneNumber: session.user.phoneNumber ?? null,
          }}
        />
      </div>
    </div>
  );
}
