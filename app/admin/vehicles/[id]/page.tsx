import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { requirePermission } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminActionDialog } from "@/components/admin/AdminActionDialog";
import { setQrActive } from "@/lib/admin/actions";
import { roleHasPermission } from "@/lib/admin/permissions";
import { publicVehicleUrl } from "@/lib/qr";
import { ArrowLeft, Car } from "lucide-react";

export const metadata = { title: "Vehicle — Admin" };

const fmt = (d: Date | null) => (d ? d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—");

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-3 border-b border-border py-2.5 text-sm last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

const yesNo = (v: boolean) => (v ? "Shown" : "Hidden");

/**
 * One vehicle, any owner (VEHICLE_READ). Shows the stored vehicle profile,
 * owner, QR state and counts — not conversation content (that stays behind
 * MESSAGE_READ_CONTENT on the messages pages).
 */
export default async function AdminVehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requirePermission("VEHICLE_READ");
  const { id } = await params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      type: true,
      registrationNumber: true,
      color: true,
      photoUrl: true,
      publicToken: true,
      qrActive: true,
      scanCount: true,
      variantScanCounts: true,
      lastScanAt: true,
      createdAt: true,
      updatedAt: true,
      owner: { select: { id: true, name: true, email: true, suspendedAt: true, createdAt: true } },
      profile: true,
      _count: { select: { conversations: true } },
    },
  });
  if (!vehicle) notFound();

  const canManageQr = roleHasPermission(admin.role, "QR_MANAGE");
  const canReadMessages = roleHasPermission(admin.role, "MESSAGE_READ_METADATA");
  const url = publicVehicleUrl(vehicle.publicToken);
  const variants = (vehicle.variantScanCounts ?? {}) as Record<string, number>;
  const p = vehicle.profile;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/admin/vehicles">
          <ArrowLeft className="h-4 w-4" aria-hidden /> All vehicles
        </Link>
      </Button>

      <PageHeader
        eyebrow="Vehicle"
        title={vehicle.name}
        description={`${vehicle.type ?? "Type not set"} · ${vehicle.registrationNumber ?? "no plate stored"}`}
        action={
          canManageQr ? (
            <AdminActionDialog
              label={vehicle.qrActive ? "Deactivate QR" : "Reactivate QR"}
              title={vehicle.qrActive ? `Deactivate the QR for ${vehicle.name}?` : `Reactivate the QR for ${vehicle.name}?`}
              description={
                vehicle.qrActive
                  ? "Scanning the sticker will show an inactive notice and the vehicle will stop accepting messages."
                  : "The sticker will work again and the vehicle will accept messages."
              }
              confirmLabel={vehicle.qrActive ? "Deactivate" : "Reactivate"}
              destructive={vehicle.qrActive}
              action={setQrActive.bind(null, vehicle.id, !vehicle.qrActive)}
            />
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {vehicle.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={vehicle.photoUrl} alt={`Photo of ${vehicle.name}`} referrerPolicy="no-referrer" className="aspect-square w-full object-cover" />
          ) : (
            <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 bg-muted text-sm text-muted-foreground">
              <Car className="h-8 w-8" aria-hidden />
              No photo
            </div>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card px-4 py-2">
            <h2 className="py-2 text-sm font-semibold">Vehicle</h2>
            <dl>
              <Row label="Vehicle ID">
                <span className="font-mono text-xs">{vehicle.id}</span>
              </Row>
              <Row label="Name">{vehicle.name}</Row>
              <Row label="Type">{vehicle.type ?? "—"}</Row>
              <Row label="Registration">{vehicle.registrationNumber ?? "—"}</Row>
              <Row label="Colour">{vehicle.color ?? "—"}</Row>
              <Row label="Photo URL">{vehicle.photoUrl ?? "—"}</Row>
              <Row label="Created">{fmt(vehicle.createdAt)}</Row>
              <Row label="Updated">{fmt(vehicle.updatedAt)}</Row>
            </dl>
          </section>

          <section className="rounded-xl border border-border bg-card px-4 py-2">
            <h2 className="py-2 text-sm font-semibold">Owner</h2>
            <dl>
              <Row label="Name">
                <Link href={`/admin/users/${vehicle.owner.id}`} className="text-primary hover:underline">
                  {vehicle.owner.name}
                </Link>
              </Row>
              <Row label="Email">{vehicle.owner.email}</Row>
              <Row label="Status">
                {vehicle.owner.suspendedAt ? <Badge variant="danger">Suspended {fmt(vehicle.owner.suspendedAt)}</Badge> : <Badge variant="success">Active</Badge>}
              </Row>
              <Row label="Joined">{fmt(vehicle.owner.createdAt)}</Row>
            </dl>
          </section>

          <section className="rounded-xl border border-border bg-card px-4 py-2">
            <h2 className="py-2 text-sm font-semibold">QR and public page</h2>
            <dl>
              <Row label="QR status">
                <Badge variant={vehicle.qrActive ? "success" : "outline"}>{vehicle.qrActive ? "Active" : "Off"}</Badge>
              </Row>
              <Row label="Public token">
                <span className="font-mono text-xs">{vehicle.publicToken}</span>
              </Row>
              <Row label="Public URL">
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {url}
                </a>
              </Row>
              <Row label="Scans">
                {vehicle.scanCount} total
                {Object.keys(variants).length > 0 && (
                  <span className="text-muted-foreground">
                    {" "}
                    ({Object.entries(variants)
                      .map(([k, n]) => `${k} ${n}`)
                      .join(", ")})
                  </span>
                )}
              </Row>
              <Row label="Last scan">{fmt(vehicle.lastScanAt)}</Row>
              <Row label="Conversations">
                {vehicle._count.conversations}
                {canReadMessages && vehicle._count.conversations > 0 && (
                  <>
                    {" · "}
                    <Link href="/admin/messages" className="text-primary hover:underline">
                      Messages
                    </Link>
                  </>
                )}
              </Row>
            </dl>
          </section>

          {p && (
            <section className="rounded-xl border border-border bg-card px-4 py-2">
              <h2 className="py-2 text-sm font-semibold">Public page visibility</h2>
              <dl>
                <Row label="Accepts messages">{p.allowMessages ? "Yes" : "No"}</Row>
                <Row label="Vehicle name">{yesNo(p.showVehicleName)}</Row>
                <Row label="Vehicle type">{yesNo(p.showVehicleType)}</Row>
                <Row label="Vehicle photo">{yesNo(p.showVehiclePhoto)}</Row>
                <Row label="Registration">{yesNo(p.showRegistrationNumber)}</Row>
                <Row label="Owner name">{yesNo(p.showOwnerName)}</Row>
                <Row label="Owner photo">{yesNo(p.showOwnerPhoto)}</Row>
                <Row label="Preferred name">{yesNo(p.showPreferredName)}</Row>
                <Row label="Contact reasons">
                  {[
                    p.allowParkingAlerts && "Parking",
                    p.allowVehicleIssues && "Vehicle issues",
                    p.allowDamageReports && "Damage",
                    p.allowEmergencyAlerts && "Emergency",
                  ]
                    .filter(Boolean)
                    .join(", ") || "None"}
                </Row>
              </dl>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
