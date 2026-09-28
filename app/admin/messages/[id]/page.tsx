import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/admin/auth";
import { roleHasPermission } from "@/lib/admin/permissions";
import { deleteConversation, moderateConversation, readMessageContent } from "@/lib/admin/actions";
import { prisma } from "@/lib/db";
import { reasonLabel } from "@/types";
import { Badge } from "@/components/ui/badge";
import { AdminActionDialog, AdminActionRow } from "@/components/admin/AdminActionDialog";
import { RevealConversationContent } from "@/components/admin/RevealConversationContent";

export const metadata = { title: "Conversation — Admin" };

function fmt(d: Date) {
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

/**
 * Conversation metadata (MESSAGE_READ_METADATA) plus permission-gated
 * actions: reveal content (MESSAGE_READ_CONTENT, audited), block/reopen
 * (MESSAGE_MODERATE), delete (CONVERSATION_DELETE). Each action re-checks its
 * permission server-side; hiding a control here is only UX.
 */
export default async function AdminConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requirePermission("MESSAGE_READ_METADATA");
  const { id } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    select: {
      id: true,
      reason: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      expiresAt: true,
      vehicle: { select: { id: true, name: true, ownerId: true, owner: { select: { name: true } } } },
      messages: { select: { senderType: true, createdAt: true }, orderBy: { createdAt: "asc" } },
      reports: { select: { id: true, status: true, createdAt: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!conversation) notFound();

  const can = {
    owners: roleHasPermission(admin.role, "USER_READ"),
    reports: roleHasPermission(admin.role, "REPORT_READ"),
    content: roleHasPermission(admin.role, "MESSAGE_READ_CONTENT"),
    moderate: roleHasPermission(admin.role, "MESSAGE_MODERATE"),
    delete: roleHasPermission(admin.role, "CONVERSATION_DELETE"),
  };
  const visitorCount = conversation.messages.filter((m) => m.senderType === "VISITOR").length;
  const expired = conversation.expiresAt < new Date();

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/admin/messages" className="text-sm text-muted-foreground hover:text-foreground">
        ← Conversations
      </Link>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight">{reasonLabel(conversation.reason)}</h1>
          <Badge variant={conversation.status === "OPEN" ? "success" : conversation.status === "BLOCKED" ? "danger" : "secondary"}>
            {conversation.status}
          </Badge>
          {expired && <Badge variant="secondary">Expired</Badge>}
        </div>
        <dl className="mt-4 grid grid-cols-[auto,1fr] gap-x-6 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Vehicle</dt>
          <dd>{conversation.vehicle.name}</dd>
          {can.owners && (
            <>
              <dt className="text-muted-foreground">Owner</dt>
              <dd>
                <Link href={`/admin/users/${conversation.vehicle.ownerId}`} className="text-primary hover:underline">
                  {conversation.vehicle.owner.name}
                </Link>
              </dd>
            </>
          )}
          <dt className="text-muted-foreground">Messages</dt>
          <dd>
            {conversation.messages.length} ({visitorCount} visitor, {conversation.messages.length - visitorCount} owner)
          </dd>
          <dt className="text-muted-foreground">Started</dt>
          <dd>{fmt(conversation.createdAt)}</dd>
          <dt className="text-muted-foreground">Last activity</dt>
          <dd>{fmt(conversation.updatedAt)}</dd>
          <dt className="text-muted-foreground">ID</dt>
          <dd className="font-mono text-xs">{conversation.id}</dd>
        </dl>
      </section>

      {can.reports && conversation.reports.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Reports</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {conversation.reports.map((r) => (
              <li key={r.id} className="flex gap-3">
                <Badge variant={r.status === "NEW" || r.status === "INVESTIGATING" ? "danger" : "secondary"}>{r.status}</Badge>
                <span className="text-muted-foreground">{fmt(r.createdAt)}</span>
              </li>
            ))}
          </ul>
          <Link href="/admin/reports" className="mt-2 inline-block text-sm text-primary hover:underline">
            Manage in Reports →
          </Link>
        </section>
      )}

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Message content</h2>
        <div className="mt-3">
          {can.content ? (
            <RevealConversationContent action={readMessageContent.bind(null, conversation.id)} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Your role can see conversation metadata only. Message content requires the MESSAGE_READ_CONTENT permission.
            </p>
          )}
        </div>
      </section>

      {(can.moderate || can.delete) && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Actions</h2>
          <AdminActionRow>
            {can.moderate && conversation.status !== "BLOCKED" && (
              <AdminActionDialog
                label="Block conversation"
                title="Block this conversation?"
                description="Neither the visitor nor the owner can send further messages. Logged as ADMIN_MODERATED_CONVERSATION."
                confirmLabel="Block"
                action={moderateConversation.bind(null, conversation.id, "BLOCKED")}
              />
            )}
            {can.moderate && conversation.status === "BLOCKED" && (
              <AdminActionDialog
                label="Reopen conversation"
                title="Reopen this conversation?"
                description="Messaging resumes (unless the conversation has expired). Logged as ADMIN_MODERATED_CONVERSATION."
                confirmLabel="Reopen"
                action={moderateConversation.bind(null, conversation.id, "OPEN")}
              />
            )}
            {can.delete && (
              <AdminActionDialog
                label="Delete conversation"
                title="Permanently delete this conversation?"
                description="All messages and reports in it are deleted and cannot be recovered. The visitor's link stops working. Logged as ADMIN_DELETED_CONVERSATION (no content is stored)."
                confirmLabel="Delete permanently"
                destructive
                doneRedirect="/admin/messages"
                action={deleteConversation.bind(null, conversation.id)}
              />
            )}
          </AdminActionRow>
        </section>
      )}
    </div>
  );
}
