import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const GET = async (req: NextRequest) => {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cursor = req.nextUrl.searchParams.get("cursor");
  const limitRaw = Number(req.nextUrl.searchParams.get("limit"));
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 20;

  const conversations = await prisma.conversation.findMany({
    where: { vehicle: { ownerId: session.user.id } },
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
    })),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  });
};
