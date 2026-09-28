import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { autoDeleteAt } from "@/lib/conversations/retention";

type RouteContext = { params: Promise<{ id: string }> };

const keepSchema = z.object({ keep: z.boolean() });

/**
 * PATCH /api/conversations/:id/keep  { keep: boolean }
 *
 * Owner opts a conversation in/out of the automatic retention purge.
 * Ownership is enforced by joining on vehicle.ownerId (someone else's id is
 * a plain 404).
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = keepSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { id } = await params;
  const conversation = await prisma.conversation.findFirst({
    where: { id, vehicle: { ownerId: session.user.id } },
    select: { id: true, updatedAt: true },
  });
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.conversation.update({
    where: { id: conversation.id },
    // Pin updatedAt: toggling keep isn't message activity, so it must not
    // reorder the inbox or restart the retention clock.
    data: { keptAt: parsed.data.keep ? new Date() : null, updatedAt: conversation.updatedAt },
    select: { keptAt: true, updatedAt: true },
  });

  return NextResponse.json({ keptAt: updated.keptAt, autoDeleteAt: autoDeleteAt(updated) });
}
