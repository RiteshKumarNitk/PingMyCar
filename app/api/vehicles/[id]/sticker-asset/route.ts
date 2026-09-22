import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { publicVehicleUrl } from "@/lib/qr";
import { stickerSvgMarkup } from "@/lib/qr/sticker";
import { isStorageConfigured, PRIVATE_BUCKET, s3Client, presignDownload } from "@/lib/storage/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Print-ready sticker asset for a vehicle the caller owns.
 *
 * With object storage configured, the SVG is pushed to the private bucket and
 * the response hands over a short-lived signed download URL (credentials stay
 * server-side). Without storage, the SVG streams directly — same UX, no
 * storage dependency.
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const vehicle = await prisma.vehicle.findFirst({
    where: { id, ownerId: session.user.id },
  });
  if (!vehicle) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const svg = stickerSvgMarkup(publicVehicleUrl(vehicle.publicToken), "square", vehicle.type);

  if (isStorageConfigured()) {
    const key = `vehicles/${vehicle.id}/sticker-${vehicle.publicToken}.svg`;
    await s3Client().send(
      new PutObjectCommand({
        Bucket: PRIVATE_BUCKET,
        Key: key,
        Body: svg,
        ContentType: "image/svg+xml",
      })
    );
    const url = await presignDownload(key, 300);
    if (url) {
      return NextResponse.json({ mode: "signed-url", url, expiresIn: 300 });
    }
  }

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Content-Disposition": `attachment; filename="pingmycar-sticker-${vehicle.publicToken}.svg"`,
    },
  });
}
