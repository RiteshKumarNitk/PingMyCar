import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const conversation = await prisma.conversation.findFirst({
    where: { id, vehicle: { ownerId: session.user.id } },
    include: {
      vehicle: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: conversation.id,
    vehicleId: conversation.vehicle.id,
    vehicleName: conversation.vehicle.name,
    reason: conversation.reason,
    status: conversation.expiresAt < new Date() ? "CLOSED" : conversation.status,
    messages: conversation.messages.map((m) => ({
      senderType: m.senderType,
      body: m.body,
      createdAt: m.createdAt,
    })),
  });
}
