import Link from "next/link";
import { requirePermission } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminActionDialog } from "@/components/admin/AdminActionDialog";
import { setQrActive } from "@/lib/admin/actions";
import { roleHasPermission } from "@/lib/admin/permissions";
import { publicVehicleUrl } from "@/lib/qr";

export const metadata = { title: "Vehicles — Admin" };

type SearchParams = Promise<{ page?: string; qr?: string }>;

const PAGE_SIZE = 50;

export default async function AdminVehiclesPage({ searchParams }: { searchParams: SearchParams }) {
  const admin = await requirePermission("VEHICLE_READ");
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const qrFilter = params.qr === "active" || params.qr === "inactive" ? params.qr : undefined;

  const where = qrFilter ? { qrActive: qrFilter === "active" } : {};
  const [vehicles, total, canManageQr] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { conversations: true } },
      },
    }),
    prisma.vehicle.count({ where }),
    Promise.resolve(roleHasPermission(admin.role, "QR_MANAGE")),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Vehicles"
        description={`${total.toLocaleString()} vehicles. Server-side pagination; ${PAGE_SIZE} per page.`}
        action={
          <div className="flex gap-2">
            <Button asChild variant={qrFilter ? "outline" : "secondary"} size="sm">
              <Link href="/admin/vehicles">All</Link>
            </Button>
            <Button asChild variant={qrFilter === "active" ? "secondary" : "outline"} size="sm">
              <Link href="/admin/vehicles?qr=active">QR Active</Link>
            </Button>
            <Button asChild variant={qrFilter === "inactive" ? "secondary" : "outline"} size="sm">
              <Link href="/admin/vehicles?qr=inactive">QR Inactive</Link>
            </Button>
          </div>
        }
      />

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Vehicle</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">QR</th>
              <th className="px-4 py-3 font-medium">Scans</th>
              <th className="px-4 py-3 font-medium">Threads</th>
              {canManageQr && <th className="px-4 py-3 font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{v.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {v.type ?? "—"} · {v.registrationNumber ?? "no plate stored"}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${v.owner.id}`} className="text-primary hover:underline">
                    {v.owner.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{v.owner.email}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={v.qrActive ? "success" : "outline"}>{v.qrActive ? "Active" : "Off"}</Badge>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{v.publicToken}</p>
                  <p className="text-xs text-muted-foreground">{publicVehicleUrl(v.publicToken)}</p>
                </td>
                <td className="px-4 py-3">{v.scanCount}</td>
                <td className="px-4 py-3">{v._count.conversations}</td>
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
                      action={(reason) => setQrActive(v.id, !v.qrActive, reason)}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
        <div className="flex gap-2">
          {page > 1 && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/vehicles?page=${page - 1}${qrFilter ? `&qr=${qrFilter}` : ""}`}>Previous</Link>
            </Button>
          )}
          {page < totalPages && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/vehicles?page=${page + 1}${qrFilter ? `&qr=${qrFilter}` : ""}`}>Next</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
