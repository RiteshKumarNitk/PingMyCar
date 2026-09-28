/**
 * Owner-API end-to-end test against the running dev server.
 * Drives the EXACT flow the Flutter app uses, including the Better Auth
 * bearer-token session the mobile client depends on.
 *
 * The owner is a Google-authenticated test user created with Better Auth's
 * test-utils plugin in THIS process (owners are Google-only; there is no
 * phone/password login to drive). Requires the dev server and this script to
 * share a local test database — never production.
 *
 * Usage: E2E_DATABASE_URL=postgresql://…@localhost/… npx tsx scripts/test-owner-api.mjs
 */
import "dotenv/config";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { testUtils } from "better-auth/plugins";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
let passed = 0;
let failed = 0;

function check(name, cond, detail = "") {
  if (cond) {
    passed++;
    console.log(`  ok    ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name} ${detail}`);
  }
}

// --- 1. Google-authenticated owner + bearer session (mobile flow) -------
const DB_URL = process.env.E2E_DATABASE_URL ?? "";
if (!/^postgres(ql)?:\/\/[^@]*@(localhost|127\.0\.0\.1)(:\d+)?\//.test(DB_URL)) {
  console.error("Set E2E_DATABASE_URL to a localhost test database (the dev server must use the same one).");
  process.exit(1);
}
const prisma = new PrismaClient({ datasourceUrl: DB_URL });
const testAuth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET,
  baseURL: BASE,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  plugins: [testUtils()],
});
const testCtx = await testAuth.$context;
const testUser = await testCtx.test.saveUser(
  testCtx.test.createUser({
    email: `owner-api-${randomBytes(4).toString("hex")}@example.test`,
    name: "Owner API Tester",
    emailVerified: true,
  })
);
// The linked-provider row a real Google sign-in creates.
await prisma.account.create({
  data: { userId: testUser.id, providerId: "google", accountId: `script-google-${randomBytes(6).toString("hex")}` },
});
// The mobile app authenticates with `Authorization: Bearer <session-token>`.
const { token: rawToken } = await testCtx.test.login({ userId: testUser.id });
check("Google test session issued", Boolean(rawToken));

const auth = { Authorization: `Bearer ${rawToken}` };

// Mobile-style get-session
const meRes = await fetch(`${BASE}/api/auth/get-session`, { headers: auth });
const me = await meRes.json().catch(() => null);
check("Bearer get-session works (mobile session)", meRes.status === 200 && me?.user?.id, JSON.stringify(me)?.slice(0, 120));
const userId = me?.user?.id;

// --- 3. Dashboard summary ------------------------------------------------
const dashRes = await fetch(`${BASE}/api/dashboard/summary`, { headers: auth });
const dash = await dashRes.json().catch(() => null);
check("GET /api/dashboard/summary 200", dashRes.status === 200);
check("summary has all counts", dash && ["vehicleCount", "activeQrCount", "unreadMessageCount", "totalMessageCount", "recentConversations"].every((k) => k in dash), JSON.stringify(dash)?.slice(0, 150));

// --- 4. Vehicle CRUD + ownership security --------------------------------
const createRes = await fetch(`${BASE}/api/vehicles`, {
  method: "POST",
  headers: { ...auth, "Content-Type": "application/json" },
  body: JSON.stringify({ name: "API Test Car", type: "CAR", registrationNumber: "RJ14XX0000" }),
});
const created = await createRes.json().catch(() => null);
check("POST /api/vehicles 201", createRes.status === 201, `status=${createRes.status}`);
check("vehicle gets publicToken", Boolean(created?.vehicle?.publicToken));
const vehicleId = created?.vehicle?.id;

// Unauthenticated access must fail
const anonRes = await fetch(`${BASE}/api/vehicles/${vehicleId}`);
check("unauthenticated vehicle GET is 401", anonRes.status === 401);

// Tampered bearer token must fail
const badRes = await fetch(`${BASE}/api/vehicles/${vehicleId}`, { headers: { Authorization: "Bearer garbage" } });
check("garbage bearer is 401", badRes.status === 401);

// Get with valid session
const getRes = await fetch(`${BASE}/api/vehicles/${vehicleId}`, { headers: auth });
check("owner GET vehicle 200", getRes.status === 200);

// QR PNG
const pngRes = await fetch(`${BASE}/api/vehicles/${vehicleId}/qr.png`, { headers: auth });
const png = Buffer.from(await pngRes.arrayBuffer());
check("QR PNG endpoint 200 + real PNG", pngRes.status === 200 && png.subarray(1, 4).toString("ascii") === "PNG", `status=${pngRes.status} bytes=${png.length}`);
check("QR PNG has plausible size", png.length > 2000, `bytes=${png.length}`);

// A4 PDF
const pdfRes = await fetch(`${BASE}/api/vehicles/${vehicleId}/sticker-a4`, { headers: auth });
const pdf = Buffer.from(await pdfRes.arrayBuffer());
check("A4 PDF endpoint 200 + real PDF", pdfRes.status === 200 && pdf.subarray(0, 5).toString("ascii") === "%PDF-", `status=${pdfRes.status}`);
check("A4 PDF non-trivial size", pdf.length > 2000, `bytes=${pdf.length}`);

// Sticker SVG (existing endpoint)
const svgRes = await fetch(`${BASE}/api/vehicles/${vehicleId}/sticker-asset`, { headers: auth });
check("sticker SVG endpoint 200", svgRes.status === 200);

// --- 5. Devices (FCM registration) ---------------------------------------
const deviceRes = await fetch(`${BASE}/api/devices/mobile`, {
  method: "POST",
  headers: { ...auth, "Content-Type": "application/json" },
  body: JSON.stringify({ token: `fcm-test-${randomBytes(16).toString("hex")}`, platform: "ANDROID", deviceId: "test-device-1" }),
});
check("POST /api/devices/mobile 201", deviceRes.status === 201, `status=${deviceRes.status}`);

const anonDevice = await fetch(`${BASE}/api/devices/mobile`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ token: "x".repeat(40), platform: "IOS" }),
});
check("unauthenticated device registration is 401", anonDevice.status === 401);

const badPlatform = await fetch(`${BASE}/api/devices/mobile`, {
  method: "POST",
  headers: { ...auth, "Content-Type": "application/json" },
  body: JSON.stringify({ token: "x".repeat(40), platform: "WEB" }),
});
check("WEB platform rejected on mobile endpoint", badPlatform.status === 400);

// --- 6. Visitor message → owner inbox (FCM must not break it) ------------
const publicToken = created.vehicle.publicToken;
const visitorRes = await fetch(`${BASE}/api/public/messages`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ publicToken, reason: "LIGHTS_ON", body: "Your headlights are on." }),
});
const visitorBody = await visitorRes.json().catch(() => null);
check("visitor message accepted", visitorRes.status === 201, `status=${visitorRes.status} ${JSON.stringify(visitorBody)?.slice(0, 120)}`);

const listRes = await fetch(`${BASE}/api/messages`, { headers: auth });
const list = await listRes.json().catch(() => null);
check("owner message list has the conversation", (list?.conversations?.length ?? 0) >= 1, JSON.stringify(list)?.slice(0, 200));
const conv = list?.conversations?.[0];

const convRes = await fetch(`${BASE}/api/conversations/${conv.id}`, { headers: auth });
const convDetail = await convRes.json().catch(() => null);
check("conversation detail has messages", (convDetail?.messages?.length ?? 0) >= 1);

// Mark read
const readRes = await fetch(`${BASE}/api/conversations/${conv.id}/read`, { method: "PATCH", headers: auth });
const readBody = await readRes.json().catch(() => null);
check("PATCH read marks messages", readRes.status === 200 && readBody?.markedRead >= 1, JSON.stringify(readBody));

// Second read is idempotent
const readAgain = await fetch(`${BASE}/api/conversations/${conv.id}/read`, { method: "PATCH", headers: auth });
const readAgainBody = await readAgain.json().catch(() => null);
check("read is idempotent (second call marks 0)", readAgainBody?.markedRead === 0);

// Report
const reportRes = await fetch(`${BASE}/api/conversations/${conv.id}/report`, {
  method: "POST",
  headers: { ...auth, "Content-Type": "application/json" },
  body: JSON.stringify({ reason: "spam-test" }),
});
check("POST report 201", reportRes.status === 201);

// Reply
const replyRes = await fetch(`${BASE}/api/conversations/${conv.id}/reply`, {
  method: "POST",
  headers: { ...auth, "Content-Type": "application/json" },
  body: JSON.stringify({ body: "Thanks, on my way!" }),
});
check("owner reply 201", replyRes.status === 201);

// Dashboard unread now 0
const dash2 = await (await fetch(`${BASE}/api/dashboard/summary`, { headers: auth })).json();
check("unread count is 0 after read", dash2.unreadMessageCount === 0, `unread=${dash2.unreadMessageCount}`);

// --- 7. Delete vehicle (cleanup) -----------------------------------------
const delRes = await fetch(`${BASE}/api/vehicles/${vehicleId}`, { method: "DELETE", headers: auth });
check("DELETE vehicle 200", delRes.status === 200);
const goneRes = await fetch(`${BASE}/api/vehicles/${vehicleId}`, { headers: auth });
check("deleted vehicle is 404", goneRes.status === 404);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
