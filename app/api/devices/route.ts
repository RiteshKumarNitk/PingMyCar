import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { registerDeviceSchema } from "@/lib/validation/device";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = registerDeviceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  // Store the full subscription JSON (not just the validated subset) — web-push
  // needs the whole shape, including fields the schema doesn't require.
  const fcmToken = JSON.stringify(body);

  await prisma.device.upsert({
    where: { fcmToken },
    update: { userId: session.user.id, platform: "WEB" },
    create: { userId: session.user.id, fcmToken, platform: "WEB" },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
