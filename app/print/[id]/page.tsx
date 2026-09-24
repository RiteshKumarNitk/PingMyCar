import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { a4StickerSheetSvg, STICKER_PRINT_MM } from "@/lib/qr/a4Sheet";
import { publicVehicleUrl } from "@/lib/qr";
import { PrintPackActions } from "@/components/qr/PrintPackActions";

export const metadata = { title: "Print sticker pack" };

export default async function PrintStickerPackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const vehicle = await prisma.vehicle.findFirst({
    where: { id, ownerId: session.user.id },
  });
  if (!vehicle) notFound();

  const publicUrl = publicVehicleUrl(vehicle.publicToken);
  const a4Svg = a4StickerSheetSvg(publicUrl, vehicle.name, vehicle.type);

  return (
    <div className="min-h-dvh bg-white text-neutral-900">
      <div className="no-print mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <div>
          <p className="text-sm font-semibold">{vehicle.name}</p>
          <p className="text-xs text-neutral-600">
            Print at 100% / actual size. Window {STICKER_PRINT_MM.square.w}×{STICKER_PRINT_MM.square.h} mm · bumper{" "}
            {STICKER_PRINT_MM.wide.w}×{STICKER_PRINT_MM.wide.h} mm · round {STICKER_PRINT_MM.round.w} mm.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PrintPackActions vehicleName={vehicle.name} a4Svg={a4Svg} />
          <Link href="/dashboard/stickers" className="text-sm text-neutral-600 underline-offset-4 hover:underline">
            Back
          </Link>
        </div>
      </div>
      <div
        className="mx-auto w-[210mm] max-w-full shadow-sm print:shadow-none"
        dangerouslySetInnerHTML={{ __html: a4Svg }}
      />
    </div>
  );
}
