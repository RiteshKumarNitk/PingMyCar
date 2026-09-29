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

/**
 * Absolute origin for links that leave the app — QR stickers above all, which
 * are printed and can never be corrected. Falls back to localhost only in
 * development; a production deploy missing NEXT_PUBLIC_APP_URL throws instead
 * of silently encoding localhost into stickers and notification links.
 */
export function appBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
  if (url) return url;
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_APP_URL must be set in production");
  }
  return "http://localhost:3100";
}

export function publicVehicleUrl(publicToken: string): string {
  return `${appBaseUrl()}/v/${publicToken}`;
}

/**
 * Token used by the website's demo stickers/QRs. It contains "1", which the
 * QR alphabet above excludes, so it can never belong to a real vehicle — a
 * scan lands on the app's own "not found" page, never on an owner.
 */
export const DEMO_PUBLIC_TOKEN = "EXAMPLE1";

/** Demo QR URL on the configured frontend (NEXT_PUBLIC_APP_URL). */
export function demoVehicleUrl(): string {
  return publicVehicleUrl(DEMO_PUBLIC_TOKEN);
}

export function conversationUrl(visitorToken: string): string {
  return `${appBaseUrl()}/c/${visitorToken}`;
}
