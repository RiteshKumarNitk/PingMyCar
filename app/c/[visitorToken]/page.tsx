import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashVisitorToken } from "@/lib/security/tokens";
import { MessageThread } from "@/components/messages/MessageThread";
import { ReportConversationLink } from "@/components/public/ReportConversationLink";

export default async function ConversationPage({ params }: { params: Promise<{ visitorToken: string }> }) {
  const { visitorToken } = await params;
  const visitorTokenHash = hashVisitorToken(visitorToken);

  const conversation = await prisma.conversation.findUnique({
    where: { visitorTokenHash },
    include: { vehicle: { select: { name: true } }, messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!conversation) notFound();

  const closed = conversation.status !== "OPEN" || conversation.expiresAt < new Date();
  const maxChars = Number(process.env.MESSAGE_MAX_CHARS ?? 500);

  return (
    <div className="mx-auto min-h-dvh max-w-sm px-4 py-10">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {conversation.vehicle.name}
      </p>
      <h1 className="mt-1 text-xl font-bold tracking-tight">Your conversation</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Save this link — it&apos;s the only way to get back to this conversation.
      </p>

      <div className="mt-6">
        <MessageThread
          submitUrl={`/api/public/conversations/${visitorToken}`}
          viewerRole="VISITOR"
          messages={conversation.messages}
          closed={closed}
          maxChars={maxChars}
        />
      </div>

      <div className="mt-6">
        <ReportConversationLink visitorToken={visitorToken} />
      </div>
    </div>
  );
}
