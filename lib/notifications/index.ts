import { prisma } from "@/lib/db";
import { isTempEmail } from "@/lib/auth/tempEmail";
import { sendEmail } from "./email";
import { sendPushToUser } from "./push";
import { sendFcmToUser } from "./fcm";

/**
 * Best-effort owner notification over every channel that's configured
 * (email, browser push). Never throws — a notification failure must never
 * break the message-send request that triggered it.
 */
export async function notifyOwner(input: {
  userId: string;
  title: string;
  body: string;
  url?: string;
  /** Privacy-safe mobile lock-screen line (no visitor message content). */
  pushBody?: string;
  conversationId?: string;
}): Promise<void> {
  const { userId, title, body, url, pushBody, conversationId } = input;
  try {
    console.log("[FCM] Owner resolved for new message");
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });

    const tasks: Promise<unknown>[] = [
      sendPushToUser(userId, { title, body, url }),
      sendFcmToUser(userId, { title, body, url, pushBody, conversationId }),
    ];
    if (user && !isTempEmail(user.email)) {
      tasks.push(sendEmail({ to: user.email, subject: title, text: url ? `${body}\n\n${url}` : body }));
    }

    await Promise.allSettled(tasks);
  } catch (err) {
    // The visitor's message is already saved — never fail their request.
    console.error("[notify] failed:", err instanceof Error ? err.message : err);
  }
}
