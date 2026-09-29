import { test, expect } from "@playwright/test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  createGuestSession,
  getGuestSession,
  revokeGuestSession,
  parseGuestToken,
  GUEST_SESSION_TTL_MS,
  type GuestStore,
} from "@/lib/guest/session";
import { resolveGuestDemo, isDemoPublicToken, GUEST_PROFILE, demoPublicView } from "@/lib/guest/demo";
import { adminAccess } from "@/lib/admin/permissions";

/** In-memory stand-in for the Verification table. */
function memoryStore() {
  const rows = new Map<string, { id: string; identifier: string; value: string; expiresAt: Date }>();
  let n = 0;
  const store: GuestStore = {
    async create({ data }) {
      const id = `row${++n}`;
      rows.set(id, { id, ...data });
      return rows.get(id);
    },
    async findFirst({ where }) {
      for (const r of rows.values()) if (r.identifier === where.identifier && r.value === where.value) return { id: r.id, expiresAt: r.expiresAt };
      return null;
    },
    async delete({ where }) {
      rows.delete(where.id);
      return null;
    },
    async deleteMany({ where }) {
      for (const [id, r] of rows) if (r.identifier === where.identifier && r.value === where.value) rows.delete(id);
      return null;
    },
  };
  return { store, rows };
}

test.describe("guest session", () => {
  test("creation: random high-entropy token, stored only as a hash, role fixed to GUEST", async () => {
    const { store, rows } = memoryStore();
    const a = await createGuestSession(new Date(), store);
    const b = await createGuestSession(new Date(), store);
    expect(a.token).toMatch(/^guest_[A-Za-z0-9_-]{43}$/);
    expect(a.token).not.toBe(b.token);
    const stored = [...rows.values()];
    expect(stored.map((r) => r.value)).toEqual(["GUEST", "GUEST"]);
    for (const r of stored) {
      expect(r.identifier).toMatch(/^guest-session:[0-9a-f]{64}$/);
      expect(r.identifier).not.toContain(a.token.slice(6));
    }
    const s = await getGuestSession(`Bearer ${a.token}`, new Date(), store);
    expect(s?.role).toBe("GUEST");
  });

  test("expiration: valid for 24 h, then rejected and cleaned up", async () => {
    const { store, rows } = memoryStore();
    const t0 = new Date("2026-09-29T10:00:00Z");
    const { token, expiresAt } = await createGuestSession(t0, store);
    expect(expiresAt.getTime() - t0.getTime()).toBe(GUEST_SESSION_TTL_MS);
    expect(await getGuestSession(`Bearer ${token}`, new Date(t0.getTime() + GUEST_SESSION_TTL_MS - 1000), store)).not.toBeNull();
    expect(await getGuestSession(`Bearer ${token}`, new Date(t0.getTime() + GUEST_SESSION_TTL_MS + 1000), store)).toBeNull();
    expect(rows.size).toBe(0);
  });

  test("logout revokes the session", async () => {
    const { store } = memoryStore();
    const { token } = await createGuestSession(new Date(), store);
    await revokeGuestSession(`Bearer ${token}`, store);
    expect(await getGuestSession(`Bearer ${token}`, new Date(), store)).toBeNull();
  });

  test("forged / tampered tokens are rejected", async () => {
    const { store } = memoryStore();
    const { token } = await createGuestSession(new Date(), store);
    const tampered = token.slice(0, -1) + (token.endsWith("A") ? "B" : "A");
    expect(await getGuestSession(`Bearer ${tampered}`, new Date(), store)).toBeNull();
    for (const bad of [null, "", "Bearer ", "Bearer guest_short", "Bearer role=OWNER", "Bearer not-a-guest-token-at-all-000000000000000000000"]) {
      expect(parseGuestToken(bad)).toBeNull();
    }
  });
});

test.describe("guest demo data", () => {
  const q = new URLSearchParams();

  test("dashboard, vehicles, messages and a conversation are demo-only and labelled", () => {
    const summary = resolveGuestDemo(["dashboard", "summary"], q);
    const vehicles = resolveGuestDemo(["vehicles"], q);
    const messages = resolveGuestDemo(["messages"], q);
    for (const r of [summary, vehicles, messages]) expect(r.kind).toBe("json");
    const vs = (vehicles as { body: { vehicles: { id: string; name: string; publicToken: string }[] } }).body.vehicles;
    expect(vs.length).toBeGreaterThan(0);
    for (const v of vs) {
      expect(v.id.startsWith("demo-")).toBe(true);
      expect(v.name).toContain("Demo");
      expect(isDemoPublicToken(v.publicToken)).toBe(true);
    }
    const convs = (messages as { body: { conversations: { id: string; lastMessage: { body: string } }[] } }).body.conversations;
    expect(convs.length).toBeGreaterThanOrEqual(3);
    for (const c of convs) {
      expect(c.id.startsWith("demo-")).toBe(true);
      expect(c.lastMessage.body).toMatch(/\(Demo (message|reply)\)/);
    }
  });

  test("real ids never resolve — there is no fallthrough to real data", () => {
    expect(resolveGuestDemo(["vehicles", "0b7c3f7e-1111-2222-3333-444455556666"], q).kind).toBe("not-found");
    expect(resolveGuestDemo(["conversations", "0b7c3f7e-1111-2222-3333-444455556666"], q).kind).toBe("not-found");
    expect(resolveGuestDemo(["admin", "users"], q).kind).toBe("not-found");
    expect(resolveGuestDemo(["devices", "mobile"], q).kind).toBe("not-found");
    expect(resolveGuestDemo(["account"], q).kind).toBe("not-found");
  });

  test("the guest profile has no email or personal data", () => {
    expect(GUEST_PROFILE.email).toBe("");
    expect(GUEST_PROFILE.image).toBeNull();
    expect(GUEST_PROFILE.name).toContain("Demo");
  });

  test("demo tokens can never be real QR tokens", () => {
    // Real tokens use only ABCDEFGHJKLMNPQRSTUVWXYZ23456789 (no 0/1).
    for (const t of ["EXAMPLE1", "EXAMPLE0"]) {
      expect(isDemoPublicToken(t)).toBe(true);
      expect(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/.test(t)).toBe(false);
    }
    expect(isDemoPublicToken("ABCD2345")).toBe(false);
    expect(demoPublicView().ownerName).toBeNull();
  });

  test("demo QR uses the configured frontend (NEXT_PUBLIC_APP_URL)", () => {
    const prev = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = "https://ping-my-car.vercel.app";
    try {
      const r = resolveGuestDemo(["vehicles", "demo-vehicle-car", "qr.png"], q);
      expect(r).toMatchObject({ kind: "qr-png", url: "https://ping-my-car.vercel.app/v/EXAMPLE1" });
    } finally {
      process.env.NEXT_PUBLIC_APP_URL = prev;
    }
  });
});

function files(dir: string, ext: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p, ext) : p.endsWith(ext) ? [p] : [];
  });
}

test.describe("guest isolation (structural)", () => {
  const routes = files("app/api", "route.ts");

  test("every owner/admin API authenticates with the Better Auth session only — never a guest token", () => {
    const ownerRoutes = routes.filter((f) => !/[\\/](public|guest|auth|health)[\\/]/.test(f));
    expect(ownerRoutes.length).toBeGreaterThan(10);
    for (const f of ownerRoutes) {
      const src = readFileSync(f, "utf8");
      expect(src, f).toMatch(/getSession\(|requirePermissionApi\(|getAdminSession\(/);
      expect(src, f).not.toContain("getGuestSession");
      expect(src, f).not.toContain("@/lib/guest");
    }
  });

  test("guest routes are read-only and never touch the database directly", () => {
    const guestRoutes = routes.filter((f) => /[\\/]guest[\\/]/.test(f));
    expect(guestRoutes.length).toBe(2);
    for (const f of guestRoutes) {
      const src = readFileSync(f, "utf8");
      expect(src, f).not.toContain("@/lib/db");
      expect(src, f).not.toMatch(/searchParams\.get\("(role|ownerId|userId)"\)|body\.(role|ownerId)/);
    }
    const demo = readFileSync(files("app/api", "route.ts").find((f) => f.includes("[...path]"))!, "utf8");
    expect(demo).not.toMatch(/export async function (POST|PUT|PATCH|DELETE)/);
  });

  test("admin pages: a request without a Better Auth session is unauthenticated (guests have none)", () => {
    for (const perm of ["ADMIN_USER_MANAGE", "VEHICLE_READ", "MESSAGE_READ_METADATA", "REPORT_READ", "USER_READ"] as const) {
      expect(adminAccess(null, perm)).toBe("unauthenticated");
    }
  });
});
