import { NextRequest, NextResponse } from "next/server";
import { purgeExpiredConversations } from "@/lib/conversations/retention";

/**
 * Daily retention purge, invoked by Vercel Cron (vercel.json).
 *
 * Vercel sends `Authorization: Bearer $CRON_SECRET`. Without CRON_SECRET
 * configured this endpoint refuses to run — deletion is never reachable
 * unauthenticated.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deleted = await purgeExpiredConversations();
  console.log(`[retention] purged ${deleted} expired conversation(s)`);
  return NextResponse.json({ ok: true, deleted });
}
