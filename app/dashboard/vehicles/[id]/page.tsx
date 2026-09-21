import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { qrSvgMarkup, publicVehicleUrl } from "@/lib/qr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VehicleForm } from "@/components/vehicles/VehicleForm";
import { DeleteVehicleButton } from "@/components/vehicles/DeleteVehicleButton";
import { QrCodeCard } from "@/components/vehicles/QrCodeCard";

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();

  const vehicle = await prisma.vehicle.findFirst({ where: { id, ownerId: session.user.id } });
  if (!vehicle) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-10 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{vehicle.name}</CardTitle>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact profile</CardTitle>
          <CardDescription>Choose what visitors see and how they can reach you.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/vehicles/${vehicle.id}/profile`}>Edit contact profile</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">QR code</CardTitle>
          <CardDescription>Print this and place it on your vehicle.</CardDescription>
        </CardHeader>
        <CardContent>
          <QrCodeCard
            vehicleId={vehicle.id}
            vehicleName={vehicle.name}
            publicUrl={publicVehicleUrl(vehicle.publicToken)}
            svgMarkup={qrSvgMarkup(publicVehicleUrl(vehicle.publicToken))}
            qrActive={vehicle.qrActive}
          />
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Delete vehicle</CardTitle>
          <CardDescription>This removes the vehicle, its profile, and all its conversations.</CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteVehicleButton vehicleId={vehicle.id} />
        </CardContent>
      </Card>
    </div>
  );
}
