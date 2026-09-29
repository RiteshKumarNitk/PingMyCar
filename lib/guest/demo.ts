import { publicVehicleUrl, DEMO_PUBLIC_TOKEN } from "@/lib/security/tokens";
import { reasonLabel } from "@/types";

/**
 * Guest/reviewer demo data — static, in-memory, clearly labelled "Demo".
 *
 * Nothing here is read from or written to the database, so a guest can never
 * see (or change) a real owner's vehicles, QR codes or conversations. Shapes
 * mirror the owner API responses exactly so the app renders them with the
 * same screens.
 *
 * Demo QR tokens contain "1"/"0", which the real QR alphabet excludes — they
 * can never collide with a real vehicle's token.
 */

export const DEMO_INACTIVE_TOKEN = "EXAMPLE0";
export const DEMO_TOKENS = new Set([DEMO_PUBLIC_TOKEN, DEMO_INACTIVE_TOKEN]);

export function isDemoPublicToken(token: string): boolean {
  return DEMO_TOKENS.has(token);
}

const minutesAgo = (now: Date, m: number) => new Date(now.getTime() - m * 60_000).toISOString();

const CAR = "demo-vehicle-car";
const SCOOTER = "demo-vehicle-scooter";

function vehicles(now: Date) {
  return [
    {
      id: CAR,
      name: "Demo Car — Honda City",
      type: "CAR",
      registrationNumber: "DEMO 1234",
      color: "Silver",
      photoUrl: null,
      publicToken: DEMO_PUBLIC_TOKEN,
      qrActive: true,
      scanCount: 12,
      createdAt: minutesAgo(now, 60 * 24 * 30),
      updatedAt: minutesAgo(now, 60 * 24 * 2),
    },
    {
      id: SCOOTER,
      name: "Demo Scooter",
      type: "SCOOTER",
      registrationNumber: null,
      color: "Blue",
      photoUrl: null,
      publicToken: DEMO_INACTIVE_TOKEN,
      qrActive: false,
      scanCount: 3,
      createdAt: minutesAgo(now, 60 * 24 * 12),
      updatedAt: minutesAgo(now, 60 * 24 * 5),
    },
  ];
}

type DemoMessage = { senderType: "VISITOR" | "OWNER"; body: string; minutesAgo: number; read: boolean };

const CONVERSATIONS: {
  id: string;
  vehicleId: string;
  reason: string;
  status: "OPEN" | "CLOSED" | "BLOCKED";
  messages: DemoMessage[];
}[] = [
  {
    id: "demo-conversation-lights",
    vehicleId: CAR,
    reason: "LIGHTS_ON",
    status: "OPEN",
    messages: [
      { senderType: "VISITOR", body: "Hi! Your headlights are still on — parked near gate 2. (Demo message)", minutesAgo: 4, read: false },
    ],
  },
  {
    id: "demo-conversation-move",
    vehicleId: CAR,
    reason: "MOVE_VEHICLE",
    status: "OPEN",
    messages: [
      { senderType: "VISITOR", body: "Your car is blocking my driveway, could you move it please? (Demo message)", minutesAgo: 95, read: true },
      { senderType: "OWNER", body: "So sorry — coming down in 2 minutes. (Demo reply)", minutesAgo: 90, read: true },
      { senderType: "VISITOR", body: "Thank you! (Demo message)", minutesAgo: 80, read: true },
    ],
  },
  {
    id: "demo-conversation-damage",
    vehicleId: SCOOTER,
    reason: "DAMAGE",
    status: "CLOSED",
    messages: [
      { senderType: "VISITOR", body: "Someone scraped your scooter's mirror while parking. (Demo message)", minutesAgo: 60 * 26, read: true },
    ],
  },
];

function vehicleName(now: Date, id: string) {
  return vehicles(now).find((v) => v.id === id)!.name;
}

function unreadCount(c: (typeof CONVERSATIONS)[number]) {
  return c.messages.filter((m) => m.senderType === "VISITOR" && !m.read).length;
}

/** Same shape as GET /api/messages (newest activity first, no paging needed). */
function messageList(now: Date, vehicleId?: string) {
  const list = CONVERSATIONS.filter((c) => !vehicleId || c.vehicleId === vehicleId)
    .map((c) => {
      const last = c.messages[c.messages.length - 1]!;
      return {
        id: c.id,
        vehicleId: c.vehicleId,
        vehicleName: vehicleName(now, c.vehicleId),
        reason: c.reason,
        status: c.status,
        lastMessage: { body: last.body, senderType: last.senderType, createdAt: minutesAgo(now, last.minutesAgo) },
        updatedAt: minutesAgo(now, last.minutesAgo),
        unread: unreadCount(c) > 0,
        unreadCount: unreadCount(c),
      };
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return { conversations: list, nextCursor: null };
}

function summary(now: Date) {
  const vs = vehicles(now);
  const recent = messageList(now).conversations.slice(0, 4);
  return {
    vehicleCount: vs.length,
    activeQrCount: vs.filter((v) => v.qrActive).length,
    unreadMessageCount: CONVERSATIONS.reduce((n, c) => n + unreadCount(c), 0),
    totalMessageCount: CONVERSATIONS.reduce((n, c) => n + c.messages.length, 0),
    recentConversations: recent.map((c) => ({
      id: c.id,
      vehicleId: c.vehicleId,
      vehicleName: c.vehicleName,
      reason: c.reason,
      reasonLabel: reasonLabel(c.reason),
      status: c.status,
      unread: c.unread,
      lastMessageBody: c.lastMessage.body,
      lastMessageAt: c.lastMessage.createdAt,
    })),
  };
}

function conversation(now: Date, id: string) {
  const c = CONVERSATIONS.find((x) => x.id === id);
  if (!c) return null;
  return {
    id: c.id,
    vehicleId: c.vehicleId,
    vehicleName: vehicleName(now, c.vehicleId),
    reason: c.reason,
    status: c.status,
    messages: c.messages.map((m) => ({ senderType: m.senderType, body: m.body, createdAt: minutesAgo(now, m.minutesAgo) })),
  };
}

/** The guest's own identity: no email, no personal data. */
export const GUEST_PROFILE = {
  id: "guest",
  name: "Guest (Demo)",
  email: "",
  image: null,
  preferredName: null,
  hasRealEmail: false,
  isGuest: true,
};

export type DemoResult =
  | { kind: "json"; body: unknown }
  | { kind: "qr-png" | "sticker-a4"; url: string; name: string; publicToken: string }
  | { kind: "not-found" };

/**
 * Resolves a read-only demo path (the part after /api/guest/) to demo data.
 * Unknown paths are "not-found" — there is no fallthrough to real data.
 */
export function resolveGuestDemo(path: string[], query: URLSearchParams, now = new Date()): DemoResult {
  const p = path.join("/");
  if (p === "me") return { kind: "json", body: { user: GUEST_PROFILE } };
  if (p === "dashboard/summary") return { kind: "json", body: summary(now) };
  if (p === "vehicles") return { kind: "json", body: { vehicles: vehicles(now) } };
  if (p === "messages") return { kind: "json", body: messageList(now, query.get("vehicle") ?? undefined) };

  if (path[0] === "vehicles" && path.length >= 2) {
    const v = vehicles(now).find((x) => x.id === path[1]);
    if (!v) return { kind: "not-found" };
    if (path.length === 2) return { kind: "json", body: { vehicle: v } };
    if (path.length === 3 && path[2] === "qr.png") {
      return { kind: "qr-png", url: publicVehicleUrl(v.publicToken), name: v.name, publicToken: v.publicToken };
    }
    if (path.length === 3 && path[2] === "sticker-a4") {
      return { kind: "sticker-a4", url: publicVehicleUrl(v.publicToken), name: v.name, publicToken: v.publicToken };
    }
    return { kind: "not-found" };
  }

  if (path[0] === "conversations" && path.length === 2) {
    const c = conversation(now, path[1]!);
    return c ? { kind: "json", body: c } : { kind: "not-found" };
  }
  return { kind: "not-found" };
}

/** Demo vehicle as shown on the public /v/<demo token> page. */
export function demoPublicView() {
  return {
    publicToken: DEMO_PUBLIC_TOKEN,
    vehicleName: "Demo Car — Honda City",
    vehicleType: "CAR" as const,
    vehiclePhotoUrl: null,
    registrationNumber: "DEMO 1234",
    ownerName: null,
    ownerPhotoUrl: null,
    contact: {
      allowMessages: true,
      allowParkingAlerts: true,
      allowVehicleIssues: true,
      allowDamageReports: true,
      allowEmergencyAlerts: true,
    },
  };
}
