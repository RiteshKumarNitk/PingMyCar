import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { auditContext, writeAudit } from "@/lib/admin/audit";

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

/**
 * DELETE /api/conversations/:id — the owner permanently deletes their own
 * conversation (messages cascade). Ownership is enforced by joining on
 * vehicle.ownerId; another owner's id is a plain 404. While a report on the
 * conversation is still open it can't be deleted, so a reported party can't
 * erase the evidence before an admin reviews it.
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const conversation = await prisma.conversation.findFirst({
    where: { id, vehicle: { ownerId: session.user.id } },
    select: {
      id: true,
      _count: { select: { messages: true, reports: { where: { status: { in: ["NEW", "INVESTIGATING"] } } } } },
    },
  });
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (conversation._count.reports > 0) {
    return NextResponse.json(
      { error: "This conversation has an open report and can't be deleted until it's reviewed." },
      { status: 409 }
    );
  }

  await prisma.conversation.delete({ where: { id: conversation.id } });

  await writeAudit({
    action: "CONVERSATION_DELETED_BY_OWNER",
    category: "MESSAGE",
    actorType: "USER",
    actorId: session.user.id,
    resourceType: "CONVERSATION",
    resourceId: conversation.id,
    metadata: { count: conversation._count.messages },
    context: await auditContext(),
  });

  return NextResponse.json({ ok: true });
}
