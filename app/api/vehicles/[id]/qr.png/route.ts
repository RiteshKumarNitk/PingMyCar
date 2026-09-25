import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { publicVehicleUrl } from "@/lib/qr";
import { qrPngBuffer } from "@/lib/qr/png";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/vehicles/:id/qr.png
 *
 * The vehicle's QR as a PNG download. Same publicToken → same public URL →
 * same code the web dashboard renders; the mobile app never generates or
 * re-encodes QR data itself.
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

  const png = qrPngBuffer(publicVehicleUrl(vehicle.publicToken), 12);
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="pingmycar-qr-${vehicle.publicToken}.png"`,
      "Cache-Control": "no-store",
    },
  });
}
