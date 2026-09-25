import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { registerFcmDeviceSchema } from "@/lib/validation/device";

/**
 * Mobile (Flutter) FCM device registration.
 *
 * POST /api/devices/mobile
 *   { token, platform: "ANDROID" | "IOS" }
 *
 * One Device row per FCM token. An owner may have several devices (phone,
 * tablet, second phone); registering one never touches the others. A token
 * that has moved between owners/accounts (app reinstall) is claimed by the
 * authenticated user — an FCM token has exactly one owner.
 *
 * DELETE /api/devices/mobile
 *   { token }
 * Unregisters ONLY the calling device's token. Logging out on one device
 * never disables the owner's other devices.
 */

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = registerFcmDeviceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid device registration" }, { status: 400 });
  }

  const { token, platform } = parsed.data;

  await prisma.$transaction(async (tx) => {
    await tx.device.deleteMany({
      where: { fcmToken: token, NOT: { userId: session.user.id } },
    });
    await tx.device.upsert({
      where: { fcmToken: token },
      update: { userId: session.user.id, platform },
      create: { userId: session.user.id, fcmToken: token, platform },
    });
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = registerFcmDeviceSchema.pick({ token: true }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid device unregistration" }, { status: 400 });
  }

  // Scoped to the session owner: a stolen token can't be used to delete
  // another user's device row, and own-device logout can't touch other rows.
  await prisma.device.deleteMany({
    where: { fcmToken: parsed.data.token, userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
