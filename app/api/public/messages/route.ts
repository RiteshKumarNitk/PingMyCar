import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateVisitorToken, hashVisitorToken } from "@/lib/security/tokens";
import { hashedIp } from "@/lib/security/ip";
import { rateLimit, visitorMessageLimit } from "@/lib/security/rate-limit";
import { startConversationSchema } from "@/lib/validation/publicMessage";
import { visibleReasons, CONTACT_REASONS, type ContactReasonId } from "@/types";
import { notifyOwner } from "@/lib/notifications";

const CONVERSATION_TTL_DAYS = 30;

export async function POST(request: NextRequest) {
  const { limit, windowMs } = visitorMessageLimit();
  const rl = rateLimit({ key: `public-messages:${hashedIp(request)}`, limit, windowMs });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many messages. Try again in a minute." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = startConversationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { publicToken, reason, body: messageBody } = parsed.data;

  const vehicle = await prisma.vehicle.findUnique({
    where: { publicToken },
    include: { profile: true },
  });
  if (!vehicle?.qrActive || !vehicle.profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!vehicle.profile.allowMessages) {
    return NextResponse.json({ error: "This vehicle isn't accepting messages" }, { status: 403 });
  }

  const allowedReasonIds = new Set(visibleReasons(vehicle.profile).map((r) => r.id));
  if (!allowedReasonIds.has(reason as ContactReasonId)) {
    return NextResponse.json({ error: "That reason isn't available for this vehicle" }, { status: 400 });
  }

  const visitorToken = generateVisitorToken();
  const visitorTokenHash = hashVisitorToken(visitorToken);
  const expiresAt = new Date(Date.now() + CONVERSATION_TTL_DAYS * 24 * 60 * 60 * 1000);

  const conversation = await prisma.conversation.create({
    data: {
      vehicleId: vehicle.id,
      visitorTokenHash,
      reason: reason as ContactReasonId,
      expiresAt,
      messages: {
        create: { senderType: "VISITOR", reason: reason as ContactReasonId, body: messageBody },
      },
    },
  });

  const reasonLabel = CONTACT_REASONS.find((r) => r.id === reason)?.label ?? reason;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3100";
  await notifyOwner({
    userId: vehicle.ownerId,
    title: `New message about ${vehicle.name}`,
    body: `${reasonLabel}: ${messageBody}`,
    url: `${appUrl}/dashboard/messages/${conversation.id}`,
  });

  return NextResponse.json({ visitorToken }, { status: 201 });
}
