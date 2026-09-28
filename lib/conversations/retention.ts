import { prisma } from "@/lib/db";

/**
 * Conversation retention.
 *
 * A conversation the owner hasn't kept is deleted RETENTION_DAYS after its
 * last activity (updatedAt — bumped by every visitor/owner message), so an
 * ongoing chat never disappears mid-conversation. Owners can "keep" a
 * conversation to exempt it. Conversations with an open moderation report
 * are never purged, so abuse evidence survives until an admin acts on it.
 */
export const RETENTION_DAYS = 5;
const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;

/** When an unkept conversation will be auto-deleted; null when kept. */
export function autoDeleteAt(conversation: { keptAt: Date | null; updatedAt: Date }): Date | null {
  if (conversation.keptAt) return null;
  return new Date(conversation.updatedAt.getTime() + RETENTION_MS);
}

/** Deletes expired, unkept conversations (messages/reports cascade). */
export async function purgeExpiredConversations(now = new Date()): Promise<number> {
  const result = await prisma.conversation.deleteMany({
    where: {
      keptAt: null,
      updatedAt: { lt: new Date(now.getTime() - RETENTION_MS) },
      reports: { none: { status: { in: ["NEW", "INVESTIGATING"] } } },
    },
  });
  return result.count;
}
