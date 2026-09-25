import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getMessaging, type Messaging } from "firebase-admin/messaging";
import { prisma } from "@/lib/db";

/**
 * FCM (HTTP v1 via firebase-admin) push for the Flutter owner app.
 *
 * Same Device table as web push — rows are separated by platform, so web
 * (WEB rows, web-push subscriptions) and mobile (ANDROID/IOS rows, raw FCM
 * tokens) never interfere.
 *
 * Rule (ARCHITECTURE invariant #22): notification failure must NEVER break
 * the visitor message that triggered it. Every failure path is caught here;
 * callers use Promise.allSettled on top of that.
 *
 * Firebase credentials come from a single GOOGLE_APPLICATION_CREDENTIALS_JSON
 * env var (the full service-account JSON) — server-side only, never shipped
 * to the app. Unset → mobile push is skipped (web push + email still run).
 */

let adminApp: App | null = null;
let messaging: Messaging | null = null;

function fcmConfigured(): boolean {
  return Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
}

function getMessagingClient(): Messaging | null {
  if (messaging) return messaging;
  if (!fcmConfigured()) return null;
  try {
    if (!adminApp) {
      const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON!);
      adminApp = initializeApp({ credential: cert(credentials) }, "pingmycar-fcm");
    }
    messaging = getMessaging(adminApp);
    return messaging;
  } catch (err) {
    console.error("[fcm] init failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

/** Sends a push notification to every Android/iOS device registered to the owner. */
export async function sendFcmToUser(userId: string, payload: { title: string; body: string; url?: string }) {
  if (!fcmConfigured()) {
    console.log(`[dev fcm] user=${userId} title="${payload.title}" (no GOOGLE_APPLICATION_CREDENTIALS_JSON, skipping)`);
    return;
  }

  const client = getMessagingClient();
  if (!client) return;

  const devices = await prisma.device.findMany({
    where: { userId, platform: { in: ["ANDROID", "IOS"] as const } },
  });
  if (devices.length === 0) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3100";
  const deepLink = payload.url?.startsWith(appUrl)
    ? payload.url.slice(appUrl.length) // e.g. /dashboard/messages/<id>
    : undefined;

  await Promise.all(
    devices.map(async (device) => {
      try {
        await client.send({
          token: device.fcmToken,
          notification: {
            title: payload.title,
            // Keep the lock-screen payload short — a teaser, not the full
            // message. The full text lives in the app after a backend fetch.
            body: payload.body.length > 140 ? `${payload.body.slice(0, 137)}…` : payload.body,
          },
          // Minimal, non-sensitive data payload — no visitor PII, no ids
          // beyond the owner-facing dashboard route the app already
          // authorizes server-side on open.
          data: deepLink ? { route: deepLink } : {},
          android: { priority: "high" },
          apns: { payload: { aps: { sound: "default" } } },
        });
      } catch (err) {
        const code = (err as { code?: string }).code;
        if (
          code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-registration-token" ||
          code === "messaging/mismatched-credential" ||
          code === "messaging/unregistered"
        ) {
          // Token is permanently dead — remove the row so we never retry it.
          await prisma.device.delete({ where: { id: device.id } }).catch(() => {});
        } else {
          console.error("[fcm] send failed:", err instanceof Error ? err.message : err);
        }
      }
    })
  );
}
