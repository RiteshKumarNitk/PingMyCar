import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/admin/auth";
import { roleHasPermission } from "@/lib/admin/permissions";
import { writeAudit } from "@/lib/admin/audit";
import { setUserSuspended } from "@/lib/admin/actions";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { AdminActionDialog } from "@/components/admin/AdminActionDialog";
import { publicVehicleUrl } from "@/lib/qr";

export const metadata = { title: "Owner detail — Admin" };

function fmt(d: Date) {
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requirePermission("USER_READ");
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      vehicles: {
        orderBy: { createdAt: "desc" },
        include: {
          profile: true,
          conversations: {
            orderBy: { updatedAt: "desc" },
            take: 20,
            include: {
              messages: { orderBy: { createdAt: "asc" }, take: 40 },
              _count: { select: { messages: true } },
            },
          },
        },
      },
    },
  });
  if (!user) notFound();

  const canReadContent = roleHasPermission(admin.role, "MESSAGE_READ_CONTENT");
  if (canReadContent) {
    await writeAudit({
      action: "MESSAGE_CONTENT_VIEWED",
      category: "MESSAGE",
      actorType: "ADMIN",
      actorId: admin.user.id,
      resourceType: "USER",
      resourceId: user.id,
      metadata: { count: user.vehicles.reduce((n, v) => n + v.conversations.length, 0) },
    });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Owner"
        title={user.name}
        description="Everything this owner has configured and received."
      />

      <dl className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase text-muted-foreground">Email</dt>
          <dd className="mt-1 text-sm">{user.email}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-muted-foreground">Phone</dt>
          <dd className="mt-1 font-mono text-sm">{user.phoneNumber ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-muted-foreground">Role</dt>
          <dd className="mt-1">
            <Badge variant="secondary">{user.adminRole}</Badge>
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-muted-foreground">Joined</dt>
          <dd className="mt-1 text-sm">{fmt(user.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-muted-foreground">Preferred name</dt>
          <dd className="mt-1 text-sm">{user.preferredName ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-muted-foreground">Status</dt>
          <dd className="mt-1">
            <Badge variant={user.suspendedAt ? "danger" : "success"}>
              {user.suspendedAt ? "Suspended" : "Active"}
            </Badge>
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-muted-foreground">User id</dt>
          <dd className="mt-1 font-mono text-xs text-muted-foreground">{user.id}</dd>
        </div>
      </dl>

      {roleHasPermission(admin.role, "USER_SUSPEND") && user.adminRole === "USER" && (
        <div className="flex flex-wrap gap-3">
          {user.suspendedAt ? (
            <AdminActionDialog
              label="Reactivate User"
              title="Reactivate this user?"
              description="The user will regain access to their PingMyCar dashboard and vehicle operations."
              confirmLabel="Reactivate User"
              action={(reason) => setUserSuspended(user.id, false, reason)}
            />
          ) : (
            <AdminActionDialog
              label="Suspend User"
              title="Suspend this user?"
              description="The user will no longer be able to add vehicles or reply to messages. Their vehicles, QR codes, and message history are preserved."
              confirmLabel="Suspend User"
              destructive
              action={(reason) => setUserSuspended(user.id, true, reason)}
            />
          )}
        </div>
      )}

      {user.vehicles.length === 0 ? (
        <p className="text-sm text-muted-foreground">This owner has not added a vehicle yet.</p>
      ) : (
        user.vehicles.map((vehicle) => (
          <section key={vehicle.id} className="space-y-4 rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{vehicle.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {vehicle.type ?? "Unspecified type"} · QR {vehicle.qrActive ? "active" : "inactive"} ·{" "}
                  {vehicle.scanCount} scans
                </p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  Token {vehicle.publicToken} · {publicVehicleUrl(vehicle.publicToken)}
                </p>
                <p className="mt-1 text-sm">Registration: {vehicle.registrationNumber ?? "—"}</p>
              </div>
              <Link href={`/admin/vehicles`} className="text-sm text-primary hover:underline">
                All vehicles
              </Link>
            </div>

            {vehicle.profile && (
              <div className="grid gap-2 text-xs sm:grid-cols-2">
                <p>Show name: {vehicle.profile.showVehicleName ? "yes" : "no"}</p>
                <p>Show type: {vehicle.profile.showVehicleType ? "yes" : "no"}</p>
                <p>Show photo: {vehicle.profile.showVehiclePhoto ? "yes" : "no"}</p>
                <p>Show registration: {vehicle.profile.showRegistrationNumber ? "yes" : "no"}</p>
                <p>Show owner name: {vehicle.profile.showOwnerName ? "yes" : "no"}</p>
                <p>Allow messages: {vehicle.profile.allowMessages ? "yes" : "no"}</p>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Conversations</h3>
              {vehicle.conversations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No visitor messages yet.</p>
              ) : (
                vehicle.conversations.map((c) => (
                  <div key={c.id} className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">
                      {c.reason} · {c.status} · {c._count.messages} messages · {fmt(c.createdAt)}
                    </p>
                    {canReadContent ? (
                      <ul className="mt-2 space-y-1 text-sm">
                        {c.messages.map((m) => (
                          <li key={m.id}>
                            <span className="font-medium">{m.senderType}:</span> {m.body}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground">Message bodies hidden for this role.</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
