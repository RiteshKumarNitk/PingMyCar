import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";

/**
 * Guest / Play-reviewer sessions.
 *
 * A guest session is deliberately NOT a Better Auth session: it lives in the
 * existing Verification table (the auth library's generic token store), so
 * `getSession()` — which every owner and admin route uses — never recognises
 * a guest token. A guest therefore cannot reach any owner or admin data even
 * by calling those APIs directly; it can only use the read-only
 * /api/guest/* demo endpoints.
 *
 * - Token: 256 random bits, prefixed `guest_`; only its SHA-256 is stored.
 * - Role: fixed to GUEST by the server — there is no field a client can set.
 * - Expiry: 24 h, checked on every request. Revocable (sign-out deletes it).
 * - No personal data, no user row, no devices/FCM.
 */

export const GUEST_TOKEN_PREFIX = "guest_";
export const GUEST_SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const IDENTIFIER_PREFIX = "guest-session:";
const ROLE = "GUEST";

export type GuestSession = { id: string; role: "GUEST"; expiresAt: Date };

/** The slice of the Verification table used here (injectable for tests). */
export type GuestStore = {
  create(args: { data: { identifier: string; value: string; expiresAt: Date } }): Promise<unknown>;
  findFirst(args: { where: { identifier: string; value: string }; select: { id: true; expiresAt: true } }): Promise<{ id: string; expiresAt: Date } | null>;
  delete(args: { where: { id: string } }): Promise<unknown>;
  deleteMany(args: { where: { identifier: string; value: string } }): Promise<unknown>;
};

const defaultStore = (): GuestStore => prisma.verification as unknown as GuestStore;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Well-formed guest token (prefix + 43 base64url chars), else null. */
export function parseGuestToken(value: string | null | undefined): string | null {
  if (!value) return null;
  const token = value.startsWith("Bearer ") ? value.slice(7).trim() : value.trim();
  return /^guest_[A-Za-z0-9_-]{43}$/.test(token) ? token : null;
}

export async function createGuestSession(now = new Date(), store: GuestStore = defaultStore()): Promise<{ token: string; expiresAt: Date }> {
  const token = GUEST_TOKEN_PREFIX + randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + GUEST_SESSION_TTL_MS);
  await store.create({
    data: { identifier: IDENTIFIER_PREFIX + hashToken(token), value: ROLE, expiresAt },
  });
  return { token, expiresAt };
}

/** The guest session for an Authorization header, or null (missing/expired/revoked). */
export async function getGuestSession(
  authorization: string | null,
  now = new Date(),
  store: GuestStore = defaultStore()
): Promise<GuestSession | null> {
  const token = parseGuestToken(authorization);
  if (!token) return null;
  const row = await store.findFirst({
    where: { identifier: IDENTIFIER_PREFIX + hashToken(token), value: ROLE },
    select: { id: true, expiresAt: true },
  });
  if (!row) return null;
  if (row.expiresAt <= now) {
    await store.delete({ where: { id: row.id } }).catch(() => {});
    return null;
  }
  return { id: row.id, role: "GUEST", expiresAt: row.expiresAt };
}

/** Ends a guest session (sign-out). Idempotent. */
export async function revokeGuestSession(authorization: string | null, store: GuestStore = defaultStore()): Promise<void> {
  const token = parseGuestToken(authorization);
  if (!token) return;
  await store.deleteMany({ where: { identifier: IDENTIFIER_PREFIX + hashToken(token), value: ROLE } });
}
