import { NextRequest, NextResponse } from "next/server";
import { getGuestSession } from "@/lib/guest/session";
import { resolveGuestDemo } from "@/lib/guest/demo";
import { rateLimit } from "@/lib/security/rate-limit";
import { qrPngBuffer } from "@/lib/qr/png";
import { stickerPrintSheetPdf } from "@/lib/qr/print-sheet-pdf";

type RouteContext = { params: Promise<{ path: string[] }> };

/**
 * GET /api/guest/<path> — read-only demo data for a valid guest session.
 *
 * Mirrors the owner API paths (dashboard/summary, vehicles, vehicles/:id,
 * vehicles/:id/qr.png, vehicles/:id/sticker-a4, messages,
 * conversations/:id, me) but serves only the static demo set in
 * lib/guest/demo.ts — never the database. There are no write handlers: any
 * other method is 405 by construction.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const guest = await getGuestSession(request.headers.get("authorization"));
  if (!guest) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit({ key: `guest-demo:${guest.id}`, limit: 300, windowMs: 10 * 60 * 1000 });
  if (!rl.ok) return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });

  const { path } = await params;
  const result = resolveGuestDemo(path, request.nextUrl.searchParams);
  switch (result.kind) {
    case "json":
      return NextResponse.json(result.body, { headers: { "Cache-Control": "no-store" } });
    case "qr-png":
      return new NextResponse(new Uint8Array(qrPngBuffer(result.url, 12)), {
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="ownerping-demo-qr-${result.publicToken}.png"`,
          "Cache-Control": "no-store",
        },
      });
    case "sticker-a4":
      return new NextResponse(new Uint8Array(await stickerPrintSheetPdf(result.url, result.name)), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="ownerping-demo-sticker-a4-${result.publicToken}.pdf"`,
          "Cache-Control": "no-store",
        },
      });
    default:
      return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
