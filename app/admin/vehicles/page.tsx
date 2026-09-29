import Link from "next/link";
import { requirePermission } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminActionDialog } from "@/components/admin/AdminActionDialog";
import { setQrActive } from "@/lib/admin/actions";
import { roleHasPermission } from "@/lib/admin/permissions";
import { adminVehicleQuery, adminVehicleWhere, parseAdminVehicleFilters, VEHICLE_TYPES } from "@/lib/admin/vehicles";
import { publicVehicleUrl } from "@/lib/qr";
import { Car } from "lucide-react";

export const metadata = { title: "Vehicles — Admin" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const PAGE_SIZE = 50;

const fmt = (d: Date) => d.toLocaleDateString("en-IN", { dateStyle: "medium" });

/**
 * Global vehicle list: every vehicle of every owner. Access comes from the
 * session's database role (VEHICLE_READ); the URL only carries filters.
 */
export default async function AdminVehiclesPage({ searchParams }: { searchParams: SearchParams }) {
  const admin = await requirePermission("VEHICLE_READ");
  const filters = parseAdminVehicleFilters(await searchParams);
  const where = adminVehicleWhere(filters);
  const canManageQr = roleHasPermission(admin.role, "QR_MANAGE");

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: PAGE_SIZE,
      skip: (filters.page - 1) * PAGE_SIZE,
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
        lastScanAt: true,
        createdAt: true,
        updatedAt: true,
        owner: { select: { id: true, name: true, email: true, suspendedAt: true } },
        profile: { select: { allowMessages: true } },
        _count: { select: { conversations: true } },
      },
    }),
    prisma.vehicle.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtered = Boolean(filters.q || filters.qr || filters.type);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Vehicles"
        description={`${total.toLocaleString()} ${filtered ? "matching" : "total"} vehicles across all owners. ${PAGE_SIZE} per page.`}
      />

      <form method="get" action="/admin/vehicles" className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-card p-3">
        <label className="flex min-w-55 flex-1 flex-col gap-1 text-xs text-muted-foreground">
          Search
          <input
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder="Vehicle name, plate, owner name or email"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Type
          <select name="type" defaultValue={filters.type ?? ""} className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground">
            <option value="">All types</option>
            {VEHICLE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          QR
          <select name="qr" defaultValue={filters.qr ?? ""} className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground">
            <option value="">Any status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <Button type="submit" size="sm">
          Apply
        </Button>
        {filtered && (
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/vehicles">Clear</Link>
          </Button>
        )}
      </form>

      {vehicles.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-12 text-center">
          <Car className="h-8 w-8 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">
            {filtered ? "No vehicles match these filters." : "No vehicles have been added yet."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-245 text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Vehicle</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">QR</th>
                <th className="px-4 py-3 font-medium">Activity</th>
                <th className="px-4 py-3 font-medium">Dates</th>
                {canManageQr && <th className="px-4 py-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id} className="border-b border-border align-top last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      {v.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={v.photoUrl} alt="" referrerPolicy="no-referrer" className="size-12 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <Car className="h-5 w-5 text-muted-foreground" aria-hidden />
                        </div>
                      )}
                      <div className="min-w-0">
                        <Link href={`/admin/vehicles/${v.id}`} className="font-medium text-primary hover:underline">
                          {v.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {v.type ?? "Type not set"} · {v.registrationNumber ?? "no plate stored"}
                          {v.color ? ` · ${v.color}` : ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${v.owner.id}`} className="text-primary hover:underline">
                      {v.owner.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{v.owner.email}</p>
                    {v.owner.suspendedAt && (
                      <Badge variant="danger" className="mt-1">
                        Owner suspended
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={v.qrActive ? "success" : "outline"}>{v.qrActive ? "Active" : "Off"}</Badge>
                      {v.profile && !v.profile.allowMessages && <Badge variant="warning">Messages off</Badge>}
                    </div>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{v.publicToken}</p>
                    <p className="text-xs text-muted-foreground">{publicVehicleUrl(v.publicToken)}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <p>
                      <span className="text-foreground">{v.scanCount}</span> scans
                    </p>
                    <p>
                      <span className="text-foreground">{v._count.conversations}</span> threads
                    </p>
                    <p>{v.lastScanAt ? `last scan ${fmt(v.lastScanAt)}` : "never scanned"}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <p>created {fmt(v.createdAt)}</p>
                    <p>updated {fmt(v.updatedAt)}</p>
                  </td>
                  {canManageQr && (
                    <td className="px-4 py-3">
                      <AdminActionDialog
                        label={v.qrActive ? "Deactivate QR" : "Reactivate QR"}
                        title={v.qrActive ? `Deactivate the QR for ${v.name}?` : `Reactivate the QR for ${v.name}?`}
                        description={
                          v.qrActive
                            ? "Scanning the sticker will show an inactive notice and the vehicle will stop accepting messages."
                            : "The sticker will work again and the vehicle will accept messages."
                        }
                        confirmLabel={v.qrActive ? "Deactivate" : "Reactivate"}
                        destructive={v.qrActive}
                        // Bound server action (a plain closure can't cross to a client component).
                        action={setQrActive.bind(null, v.id, !v.qrActive)}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {filters.page} of {totalPages}
        </p>
        <div className="flex gap-2">
          {filters.page > 1 && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/vehicles${adminVehicleQuery(filters, { page: filters.page - 1 })}`}>Previous</Link>
            </Button>
          )}
          {filters.page < totalPages && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/vehicles${adminVehicleQuery(filters, { page: filters.page + 1 })}`}>Next</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
