import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashVisitorToken } from "@/lib/security/tokens";
import { hashedIp } from "@/lib/security/ip";
import { rateLimit, visitorMessageLimit } from "@/lib/security/rate-limit";
import { reportConversationSchema } from "@/lib/validation/report";

type RouteContext = { params: Promise<{ visitorToken: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { visitorToken } = await params;

  const { limit, windowMs } = visitorMessageLimit();
  const rl = rateLimit({ key: `public-report:${hashedIp(request)}`, limit, windowMs });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  }

  const visitorTokenHash = hashVisitorToken(visitorToken);
  const conversation = await prisma.conversation.findUnique({ where: { visitorTokenHash } });
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
