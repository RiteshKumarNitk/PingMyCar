import Link from "next/link";
import { requirePermission } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shared/PageHeader";
import { AdminActionDialog } from "@/components/admin/AdminActionDialog";
import { readMessageContent } from "@/lib/admin/actions";
import { roleHasPermission } from "@/lib/admin/permissions";

export const metadata = { title: "Messages — Admin" };

type SearchParams = Promise<{ page?: string }>;

const PAGE_SIZE = 50;

function fmt(d: Date) {
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

/**
 * Metadata-first moderation feed. Message bodies are NOT rendered here —
 * content access goes through the reason-prompted, audited
 * readMessageContent action (ADMIN_VIEWED_MESSAGE_CONTENT), honoring the
 * MESSAGE_READ_CONTENT permission split.
 */
export default async function AdminMessagesPage({ searchParams }: { searchParams: SearchParams }) {
  await requirePermission("MESSAGE_READ_METADATA");
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: {
        id: true,
        conversationId: true,
        senderType: true,
        reason: true,
        createdAt: true,
        body: false,
        conversation: {
          select: {
            reason: true,
            status: true,
            vehicle: {
              select: {
                name: true,
                ownerId: true,
                owner: { select: { name: true } },
              },
            },
          },
        },
      },
    }),
    prisma.message.count(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Moderation"
        title="Messages"
        description={`${total.toLocaleString()} messages. Metadata only — body access requires a logged reason per conversation.`}
      />

      <ul className="space-y-3">
        {messages.map((m) => (
          <li key={m.id} className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <time dateTime={m.createdAt.toISOString()}>{fmt(m.createdAt)}</time>
              <span>{m.senderType}</span>
              <span>{m.reason ?? m.conversation.reason}</span>
              <span>{m.conversation.status}</span>
              <span>
                {m.conversation.vehicle.name} ·{" "}
                <Link
                  href={`/admin/users/${m.conversation.vehicle.ownerId}`}
                  className="text-primary hover:underline"
                >
                  {m.conversation.vehicle.owner.name}
                </Link>
              </span>
              <span className="ml-auto font-mono">msg {m.id.slice(0, 8)}</span>
            </div>
            <div className="mt-2">
              <AdminActionDialog
                label="View Message Content"
                title="View the content of this conversation?"
                description="Your reason is recorded in the audit log as ADMIN_VIEWED_MESSAGE_CONTENT. Access is monitored."
                confirmLabel="Reveal content"
                action={(reason) => readMessageContent(m.conversationId, reason)}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Body hidden — viewing is permission-controlled and audited.
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
        <div className="flex gap-2">
          {page > 1 && (
            <Link href={`/admin/messages?page=${page - 1}`} className="text-sm text-primary hover:underline">
              Previous
            </Link>
          )}
          {page < totalPages && (
            <Link href={`/admin/messages?page=${page + 1}`} className="text-sm text-primary hover:underline">
              Next
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
