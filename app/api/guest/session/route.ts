import { NextRequest, NextResponse } from "next/server";
import { createGuestSession, getGuestSession, revokeGuestSession } from "@/lib/guest/session";
import { GUEST_PROFILE } from "@/lib/guest/demo";
import { rateLimit } from "@/lib/security/rate-limit";
import { hashedIp } from "@/lib/security/ip";

/**
 * Guest / reviewer session (see lib/guest/session.ts).
 *
 * POST   → new guest session { token, expiresAt, user }. No input is read —
 *          nothing in the request can choose a role or an account.
 * GET    → the current guest session (Authorization: Bearer guest_…), or 401.
 * DELETE → revoke it (guest sign-out).
 */

const CREATE_LIMIT = { limit: 10, windowMs: 60 * 60 * 1000 }; // per IP per hour

export async function POST(request: NextRequest) {
  const rl = await rateLimit({ key: `guest-session:${hashedIp(request)}`, ...CREATE_LIMIT });
  if (!rl.ok) return NextResponse.json({ error: "Too many guest sessions. Try again later." }, { status: 429 });

  const { token, expiresAt } = await createGuestSession();
  return NextResponse.json({ token, expiresAt, user: GUEST_PROFILE }, { status: 201, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  const guest = await getGuestSession(request.headers.get("authorization"));
  if (!guest) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ expiresAt: guest.expiresAt, user: GUEST_PROFILE }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(request: NextRequest) {
  await revokeGuestSession(request.headers.get("authorization"));
  return NextResponse.json({ ok: true });
}
