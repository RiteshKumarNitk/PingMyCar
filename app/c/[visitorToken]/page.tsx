import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashVisitorToken } from "@/lib/security/tokens";
import { VisitorConversation } from "@/components/public/VisitorConversation";

export const metadata: Metadata = {
  title: "Your Conversation",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ visitorToken: string }>;
}) {
  const { visitorToken } = await params;

  // Server-side existence check keeps unknown tokens a hard 404 (no client
  // round-trip needed to learn the link is bogus).
  const exists = await prisma.conversation.findUnique({
    where: { visitorTokenHash: hashVisitorToken(visitorToken) },
    select: { id: true },
  });
  if (!exists) notFound();

  return <VisitorConversation visitorToken={visitorToken} />;
}
