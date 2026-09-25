import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/conversations/:id/read
 *
 * Marks every unread VISITOR message in this conversation as read.
 * Ownership comes from the session — the lookup joins on vehicle.ownerId,
 * so a wrong/guessed id is a plain 404 for someone else's conversation.
 * This is the same server-side read-state rule the web thread page applies
 * on open; unread state lives in the database, never only on the device.
 */
export async function PATCH(_request: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const conversation = await prisma.conversation.findFirst({
    where: { id, vehicle: { ownerId: session.user.id } },
    select: { id: true },
  });
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await prisma.message.updateMany({
    where: { conversationId: conversation.id, senderType: "VISITOR", readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true, markedRead: result.count });
}
