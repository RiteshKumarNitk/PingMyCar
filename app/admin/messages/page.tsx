import Link from "next/link";
import { requirePermission } from "@/lib/admin/auth";
import { roleHasPermission } from "@/lib/admin/permissions";
import { writeAudit } from "@/lib/admin/audit";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shared/PageHeader";

export const metadata = { title: "Messages — Admin" };

function fmt(d: Date) {
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AdminMessagesPage() {
  const admin = await requirePermission("MESSAGE_READ_METADATA");
  const canReadContent = roleHasPermission(admin.role, "MESSAGE_READ_CONTENT");

  const messages = await prisma.message.findMany({
    orderBy: { createdAt: "desc" },
    take: 150,
    include: {
      conversation: {
        select: {
          id: true,
          reason: true,
          status: true,
          vehicle: {
            select: {
              name: true,
              owner: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
    },
  });

  if (canReadContent) {
    await writeAudit({
      action: "MESSAGE_CONTENT_VIEWED",
      category: "MESSAGE",
      actorType: "ADMIN",
      actorId: admin.user.id,
      resourceType: "MESSAGE_FEED",
      metadata: { count: messages.length },
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Messages"
        description="Visitor and owner messages across the platform."
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
                  href={`/admin/users/${m.conversation.vehicle.owner.id}`}
                  className="text-primary hover:underline"
                >
                  {m.conversation.vehicle.owner.name}
                </Link>
              </span>
            </div>
            {canReadContent ? (
              <p className="mt-2">{m.body}</p>
            ) : (
              <p className="mt-2 text-muted-foreground">Body hidden for this role.</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
