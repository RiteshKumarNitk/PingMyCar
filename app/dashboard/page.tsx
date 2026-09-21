import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await requireSession();
  const vehicleCount = await prisma.vehicle.count({ where: { ownerId: session.user.id } });

  if (vehicleCount > 0) redirect("/dashboard/vehicles");

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 text-center sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Welcome{session.user.phoneNumber ? `, ${session.user.phoneNumber}` : ""}.
      </h1>
      <p className="mt-3 max-w-sm text-muted-foreground">
        Let&apos;s add your first vehicle and set up its private contact profile.
      </p>
      <Button asChild size="lg" className="mt-8">
        <Link href="/dashboard/vehicles/new">Add Vehicle</Link>
      </Button>
    </div>
  );
}
