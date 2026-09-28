import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ArrowRight, Car, MessageSquare, Plus, QrCode, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/StatCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { reasonLabel } from "@/types";
import { VEHICLE_TYPE_LABELS } from "@/lib/validation/vehicle";
import { Greeting } from "@/components/dashboard/Greeting";
import { EnableNotifications } from "@/components/dashboard/EnableNotifications";
import { cn } from "@/lib/utils";

export const metadata = { title: "Home" };

function timeAgo(d: Date) {
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function DashboardPage() {
  const session = await requireSession();
  const ownerId = session.user.id;

  const vehicles = await prisma.vehicle.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { conversations: true } } },
  });

  const recentConversations = await prisma.conversation.findMany({
    where: { vehicle: { ownerId } },
    include: {
      vehicle: { select: { name: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  const unreadCount = await prisma.message.count({
    where: {
      conversation: { vehicle: { ownerId } },
      senderType: "VISITOR",
      readAt: null,
    },
  });
  const activeQrCount = vehicles.filter((v) => v.qrActive).length;
  const firstName = session.user.name?.trim().split(/\s+/)[0];

  return (
    <div className="space-y-8">
      {/* Welcome + account/notification state */}
      <section className="space-y-4">
        <div>
          <Greeting firstName={firstName} />
          <p className="supporting mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-success" aria-hidden />
              Signed in with Google
            </span>
            <span aria-hidden>·</span>
            <span>
              {vehicles.length} {vehicles.length === 1 ? "vehicle" : "vehicles"} with private contact
            </span>
          </p>
        </div>
        <EnableNotifications />
      </section>

      {/* Primary actions */}
      <div className="flex flex-wrap gap-2.5">
        <Button asChild>
          <Link href="/dashboard/vehicles/new">
            <Plus aria-hidden />
            Add Vehicle
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/messages">
            <MessageSquare aria-hidden />
            View Messages
            {unreadCount > 0 && (
              <span className="rounded-full bg-comm px-1.5 text-[0.6875rem] leading-5 font-semibold text-white tabular-nums">
                {unreadCount}
              </span>
            )}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/stickers">
            <QrCode aria-hidden />
            View QR
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard icon={MessageSquare} label="Unread messages" value={unreadCount} tone="comm" href="/dashboard/messages?tab=unread" />
        <StatCard icon={Car} label="Vehicles" value={vehicles.length} href="/dashboard/vehicles" />
        <StatCard
          icon={QrCode}
          label="Active QR codes"
          value={activeQrCount}
          tone="success"
          href="/dashboard/stickers"
          hint={vehicles.length > activeQrCount ? `${vehicles.length - activeQrCount} inactive` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* Recent conversations */}
        <section aria-labelledby="recent-heading">
          <div className="flex items-center justify-between">
            <h2 id="recent-heading" className="section-title">Recent conversations</h2>
            <Button asChild variant="link" size="sm">
              <Link href="/dashboard/messages">
                View all
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>

          {recentConversations.length === 0 ? (
            <div className="mt-3">
              <EmptyState
                icon={MessageSquare}
                title="No messages yet"
                description="When someone scans your QR code, their message will appear here."
              />
            </div>
          ) : (
            <ul className="surface mt-3 divide-y divide-border overflow-hidden">
              {recentConversations.map((c) => {
                const last = c.messages[c.messages.length - 1];
                const unread = c.messages.some((m) => m.senderType === "VISITOR" && !m.readAt);
                return (
                  <li key={c.id}>
                    <Link
                      href={`/dashboard/messages/${c.id}`}
                      className="flex gap-3 px-4 py-3.5 transition-colors hover:bg-accent/60"
                    >
                      <span
                        aria-hidden
                        className={cn("mt-2 size-2 shrink-0 rounded-full", unread ? "bg-comm" : "bg-transparent")}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className={cn("truncate text-sm", unread ? "font-semibold" : "font-medium")}>
                            {reasonLabel(c.reason)}
                          </span>
                          <span className="meta shrink-0">{timeAgo(c.updatedAt)}</span>
                        </div>
                        <p className="meta mt-0.5 truncate">{c.vehicle.name}</p>
                        {last && (
                          <p className="mt-1 truncate text-sm text-muted-foreground">
                            {last.senderType === "OWNER" ? "You: " : ""}
                            {last.body}
                          </p>
                        )}
                        {unread && <span className="sr-only">Unread</span>}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Vehicles */}
        <section aria-labelledby="vehicles-heading">
          <div className="flex items-center justify-between">
            <h2 id="vehicles-heading" className="section-title">Your vehicles</h2>
            <Button asChild variant="link" size="sm">
              <Link href="/dashboard/vehicles">
                Manage
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>

          {vehicles.length === 0 ? (
            <div className="mt-3">
              <EmptyState
                icon={Car}
                title="No vehicles yet"
                description="Add your first vehicle to create a QR code."
                ctaLabel="Add Vehicle"
                ctaHref="/dashboard/vehicles/new"
              />
            </div>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {vehicles.slice(0, 4).map((vehicle) => (
                <li key={vehicle.id} className="surface flex items-center gap-3 p-3.5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <Car className="size-5" strokeWidth={1.75} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/dashboard/vehicles/${vehicle.id}`} className="block truncate text-sm font-semibold hover:text-primary">
                      {vehicle.name}
                    </Link>
                    <p className="meta mt-0.5">
                      {vehicle.registrationNumber ?? VEHICLE_TYPE_LABELS[vehicle.type ?? "OTHER"]} ·{" "}
                      {vehicle._count.conversations} {vehicle._count.conversations === 1 ? "conversation" : "conversations"}
                    </p>
                  </div>
                  <StatusBadge status={vehicle.qrActive ? "active" : "inactive"} label={vehicle.qrActive ? "QR active" : "QR inactive"} />
                  <Button asChild variant="ghost" size="icon-sm" aria-label={`QR code for ${vehicle.name}`}>
                    <Link href={`/dashboard/vehicles/${vehicle.id}/qr`}>
                      <QrCode aria-hidden />
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
