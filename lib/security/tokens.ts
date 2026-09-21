import { randomBytes, createHash } from "node:crypto";

/** Unambiguous alphabet (no 0/O/1/I) for sticker-readable public tokens. */
const QR_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generatePublicToken(length = 8): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += QR_ALPHABET[bytes[i]! % QR_ALPHABET.length];
  }
  return out;
}

export function generateVisitorToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashVisitorToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function publicVehicleUrl(publicToken: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3100";
  return `${base}/v/${publicToken}`;
}

export function conversationUrl(visitorToken: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3100";
  return `${base}/c/${visitorToken}`;
}
