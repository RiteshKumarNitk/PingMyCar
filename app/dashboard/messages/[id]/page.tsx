import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { reasonLabel } from "@/types";
import { Badge } from "@/components/ui/badge";
import { MessageThread } from "@/components/messages/MessageThread";
import { BlockConversationButton } from "@/components/messages/BlockConversationButton";

export const metadata = { title: "Message" };

export default async function MessageThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();

  const conversation = await prisma.conversation.findFirst({
    where: { id, vehicle: { ownerId: session.user.id } },
    include: {
      vehicle: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!conversation) notFound();

  const expired = conversation.expiresAt < new Date();
  const closed = conversation.status !== "OPEN" || expired;
  const status = expired ? "CLOSED" : conversation.status;
  const maxChars = Number(process.env.MESSAGE_MAX_CHARS ?? 500);

  // Opening the thread marks the visitor's messages as read.
  await prisma.message.updateMany({
    where: {
      conversationId: conversation.id,
      senderType: "VISITOR",
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/messages"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Messages
      </Link>

      <div className="mt-4 rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Private message</p>
            <h1 className="mt-1 text-xl font-bold tracking-tight">
              {reasonLabel(conversation.reason)}
            </h1>
          </div>
          <Badge
            variant={status === "OPEN" ? "success" : status === "BLOCKED" ? "danger" : "secondary"}
          >
            {status === "OPEN" ? "Open" : status === "BLOCKED" ? "Blocked" : "Closed"}
          </Badge>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <Link
            href={`/dashboard/vehicles/${conversation.vehicle.id}/messages`}
            className="font-medium text-foreground hover:text-primary"
          >
            {conversation.vehicle.name}
          </Link>
          <span>
            {conversation.createdAt.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          {expired && <span>Expired after 30 days</span>}
        </div>
      </div>

      <div className="mt-6">
        <MessageThread
          submitUrl={`/api/conversations/${conversation.id}/reply`}
          viewerRole="OWNER"
          messages={conversation.messages}
          closed={closed}
          closedLabel={
            conversation.status === "BLOCKED"
              ? "This conversation is blocked."
              : "This conversation has ended."
          }
          maxChars={maxChars}
        />
      </div>

      {conversation.status === "OPEN" && !expired && (
        <div className="mt-4">
          <BlockConversationButton conversationId={conversation.id} />
        </div>
      )}
    </div>
  );
}
