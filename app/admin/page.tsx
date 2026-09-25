import { requirePermission } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import {
  Users,
  Car,
  QrCode,
  MessageSquare,
  UserPlus,
  ShieldAlert,
  ScrollText,
} from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Admin Dashboard — PingMyCar" };

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function AdminDashboardPage() {
  await requirePermission("ANALYTICS_READ");
  const today = startOfToday();

  // Real database aggregation — no full-table loads into the browser. Each
  // count uses an indexed predicate; totals stay fast as volume grows.
  const [
    totalUsers,
    totalVehicles,
    activeQrCodes,
    messagesToday,
    scansToday,
    securityEventsToday,
    newUsersToday,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.vehicle.count(),
    prisma.vehicle.count({ where: { qrActive: true } }),
    prisma.message.count({ where: { createdAt: { gte: today } } }),
    prisma.vehicle.aggregate({ where: {}, _sum: { scanCount: true } }),
    prisma.auditLog.count({
      where: { category: "SECURITY", createdAt: { gte: today } },
    }),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
  ]);

  // Recent platform activity from the audit log — most recent first, capped.
  const recentActivity = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      createdAt: true,
      action: true,
      category: true,
      severity: true,
      result: true,
      actorType: true,
      resourceType: true,
      resourceId: true,
    },
  });

  const kpis = [
    { icon: Users, label: "Total Users", value: totalUsers },
    { icon: UserPlus, label: "New Users Today", value: newUsersToday },
    { icon: Car, label: "Total Vehicles", value: totalVehicles },
    { icon: QrCode, label: "Active QR Codes", value: activeQrCodes },
    { icon: MessageSquare, label: "Messages Today", value: messagesToday },
    // Cumulative scan count across all vehicles (scan-level timing not yet
    // tracked per-day — revisit when QR scan events are modeled).
    { icon: QrCode, label: "QR Scans (all time)", value: scansToday._sum.scanCount ?? 0 },
    { icon: ShieldAlert, label: "Security Events Today", value: securityEventsToday },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Super Admin"
        title="PingMyCar Platform Overview"
        description="Live platform health, growth, and security signals."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map(({ icon, label, value }) => (
          <StatCard key={label} icon={icon} label={label} value={value} />
        ))}
      </div>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">Recent Activity</h2>
          <Link href="/admin/activity" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>

        {recentActivity.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No activity recorded yet.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {recentActivity.map((event) => (
              <li
                key={event.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-border bg-card px-4 py-3 text-sm"
              >
                <time
                  dateTime={event.createdAt.toISOString()}
                  className="shrink-0 font-mono text-xs text-muted-foreground"
                >
                  {event.createdAt.toLocaleTimeString("en-GB", { hour12: false })}
                </time>
                <span className="font-medium">{event.action}</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  {event.category}
                </span>
                <span className="text-xs text-muted-foreground">
                  {event.actorType}
                  {event.resourceType ? ` → ${event.resourceType}` : ""}
                </span>
                {event.severity !== "INFO" && (
                  <span className="ml-auto text-xs font-medium text-warning">
                    {event.severity}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-wrap gap-3">
        <Link
          href="/admin/activity"
          className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium hover:border-primary/40"
        >
          <ScrollText className="mr-2 inline h-4 w-4" aria-hidden />
          Activity Logs
        </Link>
        <Link
          href="/admin/users"
          className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium hover:border-primary/40"
        >
          Manage Users →
        </Link>
        <Link
          href="/admin/vehicles"
          className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium hover:border-primary/40"
        >
          Manage Vehicles →
        </Link>
        <Link
          href="/admin/messages"
          className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium hover:border-primary/40"
        >
          Messages →
        </Link>
        <Link
          href="/admin/stickers"
          className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium hover:border-primary/40"
        >
          Stickers →
        </Link>
      </section>
    </div>
  );
}
