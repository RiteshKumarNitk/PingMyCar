import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getMessaging, type Messaging, type Message } from "firebase-admin/messaging";
import { prisma } from "@/lib/db";
import { appBaseUrl } from "@/lib/security/tokens";

/**
 * FCM (HTTP v1 via firebase-admin) push for the Flutter owner app.
 *
 * Same Device table as web push — rows are separated by platform, so web
 * (WEB rows, web-push subscriptions) and mobile (ANDROID/IOS rows, raw FCM
 * tokens) never interfere. An owner may have several mobile devices; every
 * registered one is notified.
 *
 * Rule (ARCHITECTURE invariant #22): notification failure must NEVER break
 * the visitor message that triggered it. Every failure path is caught here;
 * callers use Promise.allSettled on top of that.
 *
 * Firebase credentials come from a single GOOGLE_APPLICATION_CREDENTIALS_JSON
 * env var (the full service-account JSON) — server-side only, never shipped
 * to the app. It must belong to the same Firebase project as the app's
 * google-services.json. Unset → mobile push is skipped (web push + email
 * still run).
 */

/**
 * Android channel the app creates at startup (FcmService). Must match the
 * app's channel id and its AndroidManifest default_notification_channel_id,
 * otherwise Android files the alert under a low-importance fallback channel.
 */
export const ANDROID_MESSAGE_CHANNEL_ID = "ownerping_messages";

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
      adminApp =
        getApps().find((a) => a.name === "pingmycar-fcm") ??
        initializeApp({ credential: cert(credentials) }, "pingmycar-fcm");
      // Project id only (never keys) — lets a deploy confirm it matches the app.
      console.log(`[FCM] Firebase Admin initialized for project ${credentials.project_id ?? "unknown"}`);
    }
    messaging = getMessaging(adminApp);
    return messaging;
  } catch (err) {
    console.error("[FCM] init failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

export type FcmPayload = {
  title: string;
  /** Web/email body. Mobile pushes use [pushBody] instead (see below). */
  body: string;
  url?: string;
  /** Privacy-safe lock-screen text (no visitor message content). */
  pushBody?: string;
  conversationId?: string;
};

/**
 * The exact FCM message for one device. Kept pure for unit tests.
 *
 * Lock-screen text never carries the visitor's words or any contact
 * details: title + a generic line; the full message is only readable in the
 * app after an authenticated fetch. The data payload holds just the type,
 * the conversation id and the app route — the app re-verifies ownership when
 * it opens the conversation.
 */
export function buildFcmMessage(token: string, payload: FcmPayload, appUrl: string): Message {
  const route = payload.url?.startsWith(appUrl) ? payload.url.slice(appUrl.length) : undefined; // /dashboard/messages/<id>
  const data: Record<string, string> = { type: "new_message" };
  if (payload.conversationId) data.conversationId = payload.conversationId;
  if (route) data.route = route;

  return {
    token,
    notification: {
      title: payload.title,
      body: payload.pushBody ?? "Someone contacted you about your vehicle. Tap to open.",
    },
    data,
    android: {
      priority: "high",
      notification: {
        channelId: ANDROID_MESSAGE_CHANNEL_ID,
        sound: "default",
        defaultVibrateTimings: true,
        // Icon: the app manifest's default_notification_icon (monochrome).
      },
    },
    apns: { payload: { aps: { sound: "default" } } },
  };
}

const DEAD_TOKEN_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/mismatched-credential",
  "messaging/unregistered",
]);

/** Sends a push notification to every Android/iOS device registered to the owner. */
export async function sendFcmToUser(userId: string, payload: FcmPayload) {
  if (!fcmConfigured()) {
    console.log("[FCM] skipped: GOOGLE_APPLICATION_CREDENTIALS_JSON is not set");
    return;
  }

  const client = getMessagingClient();
  if (!client) return;

  const devices = await prisma.device.findMany({
    where: { userId, platform: { in: ["ANDROID", "IOS"] as const } },
  });
  console.log(`[FCM] Device tokens found: ${devices.length}`);
  if (devices.length === 0) return;

  const appUrl = appBaseUrl();
  let sent = 0;
  await Promise.all(
    devices.map(async (device) => {
      try {
        await client.send(buildFcmMessage(device.fcmToken, payload, appUrl));
        sent++;
      } catch (err) {
        const code = (err as { code?: string }).code;
        if (code && DEAD_TOKEN_CODES.has(code)) {
          // Token is permanently dead (app uninstalled, token rotated, or
          // registered with another Firebase project) — drop the row.
          console.warn(`[FCM] removing dead token (${code})`);
          await prisma.device.delete({ where: { id: device.id } }).catch(() => {});
        } else {
          console.error("[FCM] send failed:", code ?? (err instanceof Error ? err.message : err));
        }
      }
    })
  );
  console.log(`[FCM] Notification sent: ${sent}/${devices.length}`);
}
