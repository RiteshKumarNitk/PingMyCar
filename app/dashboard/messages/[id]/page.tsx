import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { CONTACT_REASONS } from "@/types";
import { MessageThread } from "@/components/messages/MessageThread";
import { BlockConversationButton } from "@/components/messages/BlockConversationButton";

function reasonLabel(id: string) {
  return CONTACT_REASONS.find((r) => r.id === id)?.label ?? id;
}

export default async function MessageThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();

  const conversation = await prisma.conversation.findFirst({
    where: { id, vehicle: { ownerId: session.user.id } },
    include: {
      vehicle: { select: { name: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!conversation) notFound();

  const closed = conversation.status !== "OPEN" || conversation.expiresAt < new Date();
  const maxChars = Number(process.env.MESSAGE_MAX_CHARS ?? 500);

  return (
    <div className="mx-auto max-w-sm px-4 py-10 sm:px-6">
      <Link href="/dashboard/messages" className="text-sm text-muted-foreground hover:text-foreground">
        ← Messages
      </Link>

      <p className="mt-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {conversation.vehicle.name}
      </p>
      <h1 className="mt-1 text-xl font-bold tracking-tight">{reasonLabel(conversation.reason)}</h1>

      <div className="mt-6">
        <MessageThread
          submitUrl={`/api/conversations/${conversation.id}/reply`}
          viewerRole="OWNER"
          messages={conversation.messages}
          closed={closed}
          closedLabel={
            conversation.status === "BLOCKED" ? "This conversation is blocked." : "This conversation has ended."
          }
          maxChars={maxChars}
        />
      </div>

      {conversation.status === "OPEN" && (
        <div className="mt-4">
          <BlockConversationButton conversationId={conversation.id} />
        </div>
      )}
    </div>
  );
}
