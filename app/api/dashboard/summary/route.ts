import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { reasonLabel } from "@/types";

/**
 * GET /api/dashboard/summary
 *
 * Aggregates for the mobile Home screen. Every query is scoped to the
 * session owner — the ownerId always comes from the session, never the
 * request. Unread counts reuse the (conversationId, senderType, readAt)
 * index; recent conversations mirror the web dashboard's Home list.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ownerId = session.user.id;

  const [vehicleCount, activeQrCount, unreadMessageCount, totalMessageCount, recentConversations] =
    await Promise.all([
      prisma.vehicle.count({ where: { ownerId } }),
      prisma.vehicle.count({ where: { ownerId, qrActive: true } }),
      prisma.message.count({
        where: { conversation: { vehicle: { ownerId } }, senderType: "VISITOR", readAt: null },
      }),
      prisma.message.count({ where: { conversation: { vehicle: { ownerId } } } }),
      prisma.conversation.findMany({
        where: { vehicle: { ownerId } },
        include: {
          vehicle: { select: { id: true, name: true } },
          messages: { orderBy: { createdAt: "asc" } },
        },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        take: 4,
      }),
    ]);

  return NextResponse.json({
    vehicleCount,
    activeQrCount,
    unreadMessageCount,
    totalMessageCount,
    recentConversations: recentConversations.map((c) => {
      const last = c.messages[c.messages.length - 1] ?? null;
      const hasUnread = c.messages.some((m) => m.senderType === "VISITOR" && !m.readAt);
      return {
        id: c.id,
        vehicleId: c.vehicle.id,
        vehicleName: c.vehicle.name,
        reason: c.reason,
        reasonLabel: reasonLabel(c.reason),
        status: c.expiresAt < new Date() ? "CLOSED" : c.status,
        unread: hasUnread,
        lastMessageBody: last?.body ?? null,
        lastMessageAt: last?.createdAt ?? c.updatedAt,
      };
    }),
  });
}
