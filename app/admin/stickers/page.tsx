import Link from "next/link";
import { requirePermission } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shared/PageHeader";
import { StickerSvg } from "@/components/qr/StickerSvg";
import { publicVehicleUrl } from "@/lib/qr";

export const metadata = { title: "Stickers — Admin" };

export default async function AdminStickersPage() {
  await requirePermission("STICKER_READ");

  const vehicles = await prisma.vehicle.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { owner: { select: { id: true, name: true, email: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Stickers"
        description="Print layouts generated for every owner vehicle."
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {vehicles.map((v) => (
          <article key={v.id} className="rounded-xl border border-border bg-card p-4">
            <p className="font-medium">{v.name}</p>
            <p className="text-xs text-muted-foreground">
              <Link href={`/admin/users/${v.owner.id}`} className="text-primary hover:underline">
                {v.owner.name}
              </Link>{" "}
              · {v.owner.email}
            </p>
            <div className="mt-4 flex justify-center rounded-lg bg-[#1a2330] p-4">
              <StickerSvg
                publicUrl={publicVehicleUrl(v.publicToken)}
                vehicleType={v.type}
                className="w-40 max-w-none"
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
