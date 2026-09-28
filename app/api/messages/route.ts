import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { autoDeleteAt } from "@/lib/conversations/retention";

export const GET = async (req: NextRequest) => {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cursor = req.nextUrl.searchParams.get("cursor");
  const vehicleFilter = req.nextUrl.searchParams.get("vehicle");
  const limitRaw = Number(req.nextUrl.searchParams.get("limit"));
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 20;

  const conversations = await prisma.conversation.findMany({
    // ownerId stays in the filter, so a foreign vehicle id just yields nothing.
    where: {
      vehicle: { ownerId: session.user.id },
      ...(vehicleFilter ? { vehicleId: vehicleFilter } : {}),
    },
    include: {
      vehicle: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = conversations.length > limit;
  const page = hasMore ? conversations.slice(0, limit) : conversations;

  // One aggregate query for per-conversation unread counts (unseen VISITOR messages).
  const unreadGroups = await prisma.message.groupBy({
    by: ["conversationId"],
    where: { conversationId: { in: page.map((c) => c.id) }, senderType: "VISITOR", readAt: null },
    _count: { _all: true },
  });
  const unreadByConversation = new Map(unreadGroups.map((g) => [g.conversationId, g._count._all]));

  return NextResponse.json({
    conversations: page.map((c) => ({
      id: c.id,
      vehicleId: c.vehicle.id,
      vehicleName: c.vehicle.name,
      reason: c.reason,
      status: c.expiresAt < new Date() ? "CLOSED" : c.status,
      lastMessage: c.messages[0]
        ? { body: c.messages[0].body, senderType: c.messages[0].senderType, createdAt: c.messages[0].createdAt }
        : null,
      updatedAt: c.updatedAt,
      unread: (unreadByConversation.get(c.id) ?? 0) > 0,
      unreadCount: unreadByConversation.get(c.id) ?? 0,
      keptAt: c.keptAt,
      autoDeleteAt: autoDeleteAt(c),
    })),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  });
};
