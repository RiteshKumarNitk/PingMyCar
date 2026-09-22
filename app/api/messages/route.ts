import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conversations = await prisma.conversation.findMany({
    where: { vehicle: { ownerId: session.user.id } },
    include: {
      vehicle: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    conversations: conversations.map((c) => ({
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
  });
}
