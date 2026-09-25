import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { suspendedOwnerGuard } from "@/lib/admin/guards";
import { prisma } from "@/lib/db";
import { replyMessageSchema } from "@/lib/validation/publicMessage";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const suspended = await suspendedOwnerGuard(session.user.id);
  if (suspended) return suspended;

  const { id } = await params;
  const conversation = await prisma.conversation.findFirst({
    where: { id, vehicle: { ownerId: session.user.id } },
  });
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
    data: { conversationId: conversation.id, senderType: "OWNER", body: parsed.data.body },
  });
  await prisma.conversation.update({ where: { id: conversation.id }, data: {} });

  return NextResponse.json({ ok: true }, { status: 201 });
}
