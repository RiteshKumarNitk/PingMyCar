import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashVisitorToken } from "@/lib/security/tokens";
import { hashedIp } from "@/lib/security/ip";
import { rateLimit, visitorMessageLimit } from "@/lib/security/rate-limit";
import { replyMessageSchema } from "@/lib/validation/publicMessage";
import { notifyOwner } from "@/lib/notifications";

type RouteContext = { params: Promise<{ visitorToken: string }> };

async function findConversation(visitorToken: string) {
  const visitorTokenHash = hashVisitorToken(visitorToken);
  return prisma.conversation.findUnique({
    where: { visitorTokenHash },
    include: { vehicle: { select: { id: true, name: true, ownerId: true } }, messages: { orderBy: { createdAt: "asc" } } },
  });
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { visitorToken } = await params;
  const conversation = await findConversation(visitorToken);
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const expired = conversation.expiresAt < new Date();

  return NextResponse.json({
    vehicleName: conversation.vehicle.name,
    status: expired ? "CLOSED" : conversation.status,
    messages: conversation.messages.map((m) => ({
      senderType: m.senderType,
      body: m.body,
      createdAt: m.createdAt,
    })),
  });
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { visitorToken } = await params;

  const { limit, windowMs } = visitorMessageLimit();
  const rl = rateLimit({ key: `public-reply:${hashedIp(request)}`, limit, windowMs });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many messages. Try again in a minute." }, { status: 429 });
  }

  const conversation = await findConversation(visitorToken);
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (conversation.status !== "OPEN" || conversation.expiresAt < new Date()) {
    return NextResponse.json({ error: "This conversation is closed" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = replyMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  await prisma.message.create({
    data: { conversationId: conversation.id, senderType: "VISITOR", body: parsed.data.body },
  });
  // Bump updatedAt so the owner's inbox sorts by most recent activity.
  await prisma.conversation.update({ where: { id: conversation.id }, data: {} });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3100";
  await notifyOwner({
    userId: conversation.vehicle.ownerId,
    title: `New reply about ${conversation.vehicle.name}`,
    body: parsed.data.body,
    url: `${appUrl}/dashboard/messages/${conversation.id}`,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
