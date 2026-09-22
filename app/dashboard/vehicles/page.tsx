import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Car, QrCode, MessageSquare, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { VEHICLE_TYPE_LABELS } from "@/lib/validation/vehicle";
import { qrSvgMarkup } from "@/lib/qr";

export const metadata = { title: "My Vehicles" };

export default async function VehiclesPage() {
  const session = await requireSession();
  const vehicles = await prisma.vehicle.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { conversations: true } },
      conversations: {
        orderBy: { updatedAt: "desc" },
        take: 1,
        include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
      },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Vehicles"
        description="Each vehicle has its own QR code and its own private inbox."
        action={
          <Button asChild>
            <Link href="/dashboard/vehicles/new">+ Add Vehicle</Link>
          </Button>
        }
      />

      {vehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No vehicles yet."
          description="Add your first vehicle to create your PingMyCar QR."
          ctaLabel="Add Vehicle"
          ctaHref="/dashboard/vehicles/new"
        />
      ) : (
        <ul className="space-y-4">
          {vehicles.map((vehicle) => {
            const lastConversation = vehicle.conversations[0];
            const lastMessage = lastConversation?.messages[0];
            return (
              <li key={vehicle.id}>
                <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Car className="h-6 w-6" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/dashboard/vehicles/${vehicle.id}`}
                          className="font-semibold hover:text-primary"
                        >
                          {vehicle.name}
                        </Link>
                        <Badge variant={vehicle.qrActive ? "success" : "warning"}>
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${vehicle.qrActive ? "bg-success" : "bg-warning"}`}
                            aria-hidden
                          />
                          {vehicle.qrActive ? "QR Active" : "QR Inactive"}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {vehicle.registrationNumber ?? VEHICLE_TYPE_LABELS[vehicle.type ?? "OTHER"]}
                        {" · "}
                        {vehicle._count.conversations}{" "}
                        {vehicle._count.conversations === 1 ? "message" : "messages"}
                      </p>
                      {lastMessage && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          Last: {lastMessage.senderType === "OWNER" ? "You: " : ""}
                          {lastMessage.body}
                        </p>
                      )}
                    </div>
                  </div>

                  <div
                    className="hidden h-16 w-16 shrink-0 rounded-lg border border-border bg-white p-1.5 sm:block"
                    aria-hidden
                    dangerouslySetInnerHTML={{
                      __html: qrSvgMarkup(`https://pingmycar.app/v/${vehicle.publicToken}`, 2),
                    }}
                  />

                  <div className="grid grid-cols-4 gap-2 sm:w-auto sm:grid-cols-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/vehicles/${vehicle.id}`}>
                        <Settings className="h-4 w-4" aria-hidden />
                        View
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/messages?vehicle=${vehicle.id}`}>
                        <MessageSquare className="h-4 w-4" aria-hidden />
                        Messages
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/vehicles/${vehicle.id}/qr`}>
                        <QrCode className="h-4 w-4" aria-hidden />
                        QR
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/vehicles/${vehicle.id}/profile`}>
                        <Settings className="h-4 w-4" aria-hidden />
                        Settings
                      </Link>
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
