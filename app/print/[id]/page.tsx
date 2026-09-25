import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { a4StickerSheetSvg } from "@/lib/qr/a4Sheet";
import { stickerSvgMarkup, STICKER_PRINT_MM, STICKER_VARIANTS } from "@/lib/qr/sticker";
import { publicVehicleUrl } from "@/lib/qr";
import { PrintPackActions } from "@/components/qr/PrintPackActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const stickerSvgs = STICKER_VARIANTS.map((v) => ({
    variant: v.id,
    svg: stickerSvgMarkup(publicUrl, v.id, vehicle.type),
  }));

  return (
    <div className="min-h-dvh bg-white text-neutral-900">
      <div className="no-print mx-auto max-w-3xl space-y-4 px-4 py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold">{vehicle.name}</p>
            <p className="text-sm text-neutral-600">
              {[STICKER_PRINT_MM.square, STICKER_PRINT_MM.wide, STICKER_PRINT_MM.plate, STICKER_PRINT_MM.round, STICKER_PRINT_MM.arrow]
                .map((s) => s.label)
                .join(" · ")}
            </p>
            <p className="text-xs text-neutral-500">
              Paper: A4 (210 × 297 mm) · Print scale: 100% · 5 stickers per sheet
            </p>
          </div>
          <div className="flex items-center gap-3">
            <PrintPackActions vehicleName={vehicle.name} stickerSvgs={stickerSvgs} />
            <Link href="/dashboard/stickers" className="text-sm text-neutral-600 underline-offset-4 hover:underline">
              Back
            </Link>
          </div>
        </div>

        <Card className="rounded-xl border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-950">Print at 100% / Actual Size</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs text-amber-950">
            <p>Do not select Fit to Page, Shrink to Fit, or similar scaling options.</p>
            <p>Check the printed size with a ruler before cutting — scaling changes the QR dimensions.</p>
          </CardContent>
        </Card>

        <p className="text-xs text-neutral-500">
          Placement guide: rear windshield (window vinyl) · bumper or plate surround (bumper strip or
          license-plate sticker) · side window or helmet (round or arrow badge). Keep it visible and
          scannable without obstructing the driver&apos;s view, lights, or license plate — follow local
          vehicle regulations.
        </p>
      </div>

      <div
        className="mx-auto w-[210mm] max-w-full shadow-sm print:shadow-none"
        dangerouslySetInnerHTML={{ __html: a4Svg }}
      />
    </div>
  );
}
