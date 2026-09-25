import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { reportConversationSchema } from "@/lib/validation/report";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/conversations/:id/report
 *
 * Owner reports a conversation (abusive visitor, wrong vehicle, spam).
 * Reuses the existing Report model — same records the admin side already
 * reads; no new reporting system.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const conversation = await prisma.conversation.findFirst({
    where: { id, vehicle: { ownerId: session.user.id } },
    select: { id: true },
  });
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const parsed = reportConversationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  await prisma.report.create({
    data: { conversationId: conversation.id, reason: parsed.data.reason },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
