import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { publicVehicleUrl } from "@/lib/qr";
import { stickerPrintSheetPdf } from "@/lib/qr/print-sheet-pdf";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/vehicles/:id/sticker-a4
 *
 * Print-ready A4 sheet (210×297 mm) for this vehicle's sticker:
 *  - real vehicle QR (same publicToken as every other surface)
 *  - crop marks, physical sticker size, "print at 100%" instruction,
 *    placement guide — per the sticker spec
 *
 * Returns a vector PDF: the QR is drawn as vector rectangles (no
 * rasterization), so it prints crisp at any DPI.
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const vehicle = await prisma.vehicle.findFirst({
    where: { id, ownerId: session.user.id },
    select: { publicToken: true, name: true },
  });
  if (!vehicle) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const pdfBytes = await stickerPrintSheetPdf(publicVehicleUrl(vehicle.publicToken), vehicle.name);

  return new NextResponse(new Uint8Array(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="pingmycar-sticker-a4-${vehicle.publicToken}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
