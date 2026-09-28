import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { reasonLabel } from "@/types";
import { ChevronLeft, Car, Lock } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { MessageThread } from "@/components/messages/MessageThread";
import { BlockConversationButton } from "@/components/messages/BlockConversationButton";
import { DeleteConversationButton } from "@/components/messages/DeleteConversationButton";

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
        className="inline-flex items-center gap-1 rounded-md text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Messages
      </Link>

      <header className="mt-4 border-b border-border pb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow flex items-center gap-1.5">
              <Lock className="size-3" aria-hidden />
              Private conversation
            </p>
            <h1 className="page-title mt-1.5">{reasonLabel(conversation.reason)}</h1>
          </div>
          <StatusBadge status={status === "OPEN" ? "open" : status === "BLOCKED" ? "blocked" : "closed"} className="mt-1" />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <Link
            href={`/dashboard/vehicles/${conversation.vehicle.id}/messages`}
            className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary"
          >
            <Car className="size-4" aria-hidden />
            {conversation.vehicle.name}
          </Link>
          <span aria-hidden>·</span>
          <span>
            Started{" "}
            {conversation.createdAt.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          {expired && (
            <>
              <span aria-hidden>·</span>
              <span>Expired after 30 days</span>
            </>
          )}
        </div>
        <p className="meta mt-2">The visitor can&apos;t see your phone number or email.</p>
      </header>

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

      {/* Destructive actions, kept apart from everyday reply actions */}
      <section aria-label="Conversation actions" className="mt-10 space-y-3 border-t border-border pt-5">
        {conversation.status === "OPEN" && !expired && (
          <BlockConversationButton conversationId={conversation.id} />
        )}
        <DeleteConversationButton conversationId={conversation.id} />
      </section>
    </div>
  );
}
