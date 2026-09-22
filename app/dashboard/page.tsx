import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Car, MessageSquare, MessagesSquare, QrCode, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/StatCard";
import { reasonLabel } from "@/types";
import { VEHICLE_TYPE_LABELS } from "@/lib/validation/vehicle";
import { Greeting } from "@/components/dashboard/Greeting";

export const metadata = { title: "Overview" };

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
    take: 4,
  });

  const totalMessages = await prisma.message.count({
    where: { conversation: { vehicle: { ownerId } } },
  });
  const unreadCount = await prisma.message.count({
    where: {
      conversation: { vehicle: { ownerId } },
      senderType: "VISITOR",
      readAt: null,
    },
  });
  const activeQrCount = vehicles.filter((v) => v.qrActive).length;

  return (
    <div className="space-y-8">
      <div>
        <Greeting />
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening with your vehicles.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Car} label="Vehicles" value={vehicles.length} />
        <StatCard icon={MessageSquare} label="Unread Messages" value={unreadCount} />
        <StatCard icon={MessagesSquare} label="Total Messages" value={totalMessages} />
        <StatCard icon={QrCode} label="Active QR Codes" value={activeQrCount} />
      </div>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">My Vehicles</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/vehicles">
              View all
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>

        {vehicles.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No vehicles yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {vehicles.slice(0, 3).map((vehicle) => (
              <li key={vehicle.id}>
                <Card className="rounded-xl transition-colors hover:border-primary/40">
                  <CardContent className="flex flex-wrap items-center gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Car className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{vehicle.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.registrationNumber ?? VEHICLE_TYPE_LABELS[vehicle.type ?? "OTHER"]}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={vehicle.qrActive ? "success" : "warning"}>
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${vehicle.qrActive ? "bg-success" : "bg-warning"}`}
                          aria-hidden
                        />
                        {vehicle.qrActive ? "QR Active" : "QR Inactive"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {vehicle._count.conversations}{" "}
                        {vehicle._count.conversations === 1 ? "Message" : "Messages"}
                      </span>
                    </div>
                    <div className="flex w-full gap-2 sm:w-auto">
                      <Button asChild variant="outline" size="sm" className="flex-1">
                        <Link href={`/dashboard/vehicles/${vehicle.id}/qr`}>View QR</Link>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="flex-1">
                        <Link href={`/dashboard/messages?vehicle=${vehicle.id}`}>Messages</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">Recent Messages</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/messages">
              View all
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>

        {recentConversations.length === 0 ? (
          <Card className="mt-4 rounded-xl">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                No messages yet.
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Once someone scans your vehicle&apos;s QR, their message will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ul className="mt-4 space-y-3">
            {recentConversations.map((c) => {
              const last = c.messages[c.messages.length - 1];
              const unread = c.messages.some(
                (m) => m.senderType === "VISITOR" && !m.readAt
              );
              return (
                <li key={c.id}>
                  <Link
                    href={`/dashboard/messages/${c.id}`}
                    className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-medium">
                        {reasonLabel(c.reason)}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {c.vehicle.name}
                      </span>
                    </div>
                    {last && (
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {last.senderType === "OWNER" ? "You: " : ""}
                        {last.body}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      {unread && (
                        <Badge variant="default" className="px-2 py-0 text-[10px]">
                          New
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {c.messages.length} {c.messages.length === 1 ? "message" : "messages"}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
