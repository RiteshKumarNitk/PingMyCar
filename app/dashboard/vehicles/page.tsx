import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { VEHICLE_TYPE_LABELS } from "@/lib/validation/vehicle";

export const metadata = { title: "Vehicles" };

export default async function VehiclesPage() {
  const session = await requireSession();
  const vehicles = await prisma.vehicle.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Vehicles</h1>
        <Button asChild size="sm">
          <Link href="/dashboard/vehicles/new">Add Vehicle</Link>
        </Button>
      </div>

      {vehicles.length === 0 ? (
        <p className="mt-8 text-muted-foreground">You haven&apos;t added a vehicle yet.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {vehicles.map((vehicle) => (
            <li key={vehicle.id}>
              <Link
                href={`/dashboard/vehicles/${vehicle.id}`}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <div>
                  <p className="font-medium">{vehicle.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {vehicle.type ? VEHICLE_TYPE_LABELS[vehicle.type] : "Vehicle"}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium ${vehicle.qrActive ? "text-primary" : "text-muted-foreground"}`}
                >
                  {vehicle.qrActive ? "QR active" : "QR inactive"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
