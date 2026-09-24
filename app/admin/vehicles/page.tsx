import Link from "next/link";
import { requirePermission } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { publicVehicleUrl } from "@/lib/qr";

export const metadata = { title: "Vehicles — Admin" };

export default async function AdminVehiclesPage() {
  await requirePermission("VEHICLE_READ");

  const vehicles = await prisma.vehicle.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { conversations: true } },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Vehicles"
        description="Every vehicle and QR created by owners."
      />

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Vehicle</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">QR</th>
              <th className="px-4 py-3 font-medium">Scans</th>
              <th className="px-4 py-3 font-medium">Threads</th>
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
                  <Badge variant={v.qrActive ? "secondary" : "outline"}>{v.qrActive ? "Active" : "Off"}</Badge>
                  <p className="mt-1 font-mono text-xs">{v.publicToken}</p>
                  <p className="text-xs text-muted-foreground">{publicVehicleUrl(v.publicToken)}</p>
                </td>
                <td className="px-4 py-3">{v.scanCount}</td>
                <td className="px-4 py-3">{v._count.conversations}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
