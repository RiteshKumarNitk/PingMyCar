import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Car, ExternalLink, MessageSquare, Pencil, Plus, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { VEHICLE_TYPE_LABELS } from "@/lib/validation/vehicle";
import { qrSvgMarkup, publicVehicleUrl } from "@/lib/qr";

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
            <Link href="/dashboard/vehicles/new">
              <Plus aria-hidden />
              Add Vehicle
            </Link>
          </Button>
        }
      />

      {vehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No vehicles yet"
          description="Add your first vehicle to create a QR code."
          ctaLabel="Add Vehicle"
          ctaHref="/dashboard/vehicles/new"
        />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {vehicles.map((vehicle) => {
            const lastMessage = vehicle.conversations[0]?.messages[0];
            const count = vehicle._count.conversations;
            return (
              <li key={vehicle.id} className="surface flex flex-col overflow-hidden">
                <div className="flex gap-4 p-4 sm:p-5">
                  {vehicle.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={vehicle.photoUrl} alt="" className="size-16 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                      <Car className="size-8" strokeWidth={1.5} aria-hidden />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/dashboard/vehicles/${vehicle.id}`}
                      className="block truncate text-base font-semibold tracking-tight hover:text-primary"
                    >
                      {vehicle.name}
                    </Link>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      {vehicle.registrationNumber ? (
                        <span className="rounded-md border border-foreground/15 bg-surface-2 px-1.5 py-0.5 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.12em]">
                          {vehicle.registrationNumber}
                        </span>
                      ) : (
                        <span className="meta">{VEHICLE_TYPE_LABELS[vehicle.type ?? "OTHER"]}</span>
                      )}
                      <StatusBadge
                        status={vehicle.qrActive ? "active" : "inactive"}
                        label={vehicle.qrActive ? "QR active" : "QR off"}
                      />
                    </div>
                    <p className="meta mt-2 flex items-center gap-1.5">
                      <MessageSquare className="size-3.5" aria-hidden />
                      {count} {count === 1 ? "conversation" : "conversations"}
                    </p>
                    {lastMessage && (
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {lastMessage.senderType === "OWNER" ? "You: " : ""}
                        {lastMessage.body}
                      </p>
                    )}
                  </div>
                  <div
                    className="hidden size-18 shrink-0 rounded-lg border border-border bg-white p-1.5 sm:block"
                    aria-hidden
                    dangerouslySetInnerHTML={{
                      __html: qrSvgMarkup(publicVehicleUrl(vehicle.publicToken), 2),
                    }}
                  />
                </div>

                <div className="mt-auto grid grid-cols-4 border-t border-border bg-surface-2/50">
                  {[
                    { href: `/v/${vehicle.publicToken}`, label: "View", icon: ExternalLink, external: true },
                    { href: `/dashboard/vehicles/${vehicle.id}/qr`, label: "QR", icon: QrCode },
                    { href: `/dashboard/messages?vehicle=${vehicle.id}`, label: "Messages", icon: MessageSquare },
                    { href: `/dashboard/vehicles/${vehicle.id}`, label: "Edit", icon: Pencil },
                  ].map(({ href, label, icon: Icon, external }) => (
                    <Link
                      key={label}
                      href={href}
                      {...(external ? { target: "_blank", rel: "noopener" } : {})}
                      className="flex min-h-12 flex-col items-center justify-center gap-1 border-l border-border text-xs font-medium text-foreground/75 transition-colors first:border-l-0 hover:bg-accent hover:text-foreground sm:flex-row sm:gap-1.5 sm:text-sm"
                    >
                      <Icon className="size-4" strokeWidth={1.75} aria-hidden />
                      {label}
                      {external && <span className="sr-only">(opens the public page in a new tab)</span>}
                    </Link>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
