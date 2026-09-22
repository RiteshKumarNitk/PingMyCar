import webpush from "web-push";
import { prisma } from "@/lib/db";

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails("mailto:support@pingmycar.app", vapidPublicKey, vapidPrivateKey);
}

function statusCodeOf(err: unknown): number | undefined {
  if (err && typeof err === "object" && "statusCode" in err) {
    return (err as { statusCode?: number }).statusCode;
  }
  return undefined;
}

/** Sends a web push notification to every browser the owner has enabled notifications on. */
export async function sendPushToUser(userId: string, payload: { title: string; body: string; url?: string }) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.log(`[dev push] user=${userId} title="${payload.title}" (no VAPID keys configured, skipping)`);
    return;
  }

  const devices = await prisma.device.findMany({ where: { userId, platform: "WEB" } });

  await Promise.all(
    devices.map(async (device) => {
      try {
        const subscription = JSON.parse(device.fcmToken);
        await webpush.sendNotification(subscription, JSON.stringify(payload));
      } catch (err) {
        const statusCode = statusCodeOf(err);
        if (statusCode === 404 || statusCode === 410) {
          // Subscription is gone (permission revoked, browser data cleared, etc).
          await prisma.device.delete({ where: { id: device.id } }).catch(() => {});
        } else {
          console.error("[push] send failed:", err instanceof Error ? err.message : err);
        }
      }
    })
  );
}
