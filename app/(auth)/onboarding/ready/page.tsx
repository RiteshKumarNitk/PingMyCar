import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { qrSvgMarkup, publicVehicleUrl } from "@/lib/qr";
import { QrSvg } from "@/components/qr/QrSvg";
import { Button } from "@/components/ui/button";
import { VehicleQrActions } from "@/components/vehicles/VehicleQrActions";

export const metadata = { title: "Your Vehicle Is Ready" };

export default async function OnboardingReadyPage({
  searchParams,
}: {
  searchParams: Promise<{ vehicle?: string }>;
}) {
  const session = await requireSession();
  const { vehicle: vehicleId } = await searchParams;

  const vehicle = vehicleId
    ? await prisma.vehicle.findFirst({
        where: { id: vehicleId, ownerId: session.user.id },
        include: { profile: true },
      })
    : null;
  if (!vehicle) redirect("/dashboard");

  const publicUrl = publicVehicleUrl(vehicle.publicToken);

  return (
    <div className="w-full text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-bg text-success">
        <CheckCircle2 className="h-7 w-7" aria-hidden />
      </span>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">🎉 Your vehicle is ready!</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your PingMyCar QR has been created and is active.
      </p>

      <div className="mt-6 rounded-xl border border-border bg-background p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {vehicle.name}
        </p>
        <QrSvg publicUrl={publicUrl} className="mx-auto mt-4 w-44" />
        <p className="mt-3 break-all text-xs text-muted-foreground">{publicUrl}</p>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <VehicleQrActions vehicleName={vehicle.name} qrSvg={qrSvgMarkup(publicUrl, 8)} compact />
        <Button asChild className="w-full">
          <Link href={`/dashboard/vehicles/${vehicle.id}/qr`}>View My QR</Link>
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <Link href="/dashboard">Continue to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
