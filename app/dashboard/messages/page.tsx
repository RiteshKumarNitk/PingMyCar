import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { CONTACT_REASONS } from "@/types";
import { EnableNotifications } from "@/components/dashboard/EnableNotifications";

export const metadata = { title: "Messages" };

function reasonLabel(id: string) {
  return CONTACT_REASONS.find((r) => r.id === id)?.label ?? id;
}

export default async function MessagesPage() {
  const session = await requireSession();

  const conversations = await prisma.conversation.findMany({
    where: { vehicle: { ownerId: session.user.id } },
    include: {
      vehicle: { select: { name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Messages</h1>

      <div className="mt-6">
        <EnableNotifications />
      </div>

      {conversations.length === 0 ? (
        <p className="mt-8 text-muted-foreground">No messages yet.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {conversations.map((c) => {
            const status = c.expiresAt < new Date() ? "CLOSED" : c.status;
            const last = c.messages[0];
            return (
              <li key={c.id}>
                <Link
                  href={`/dashboard/messages/${c.id}`}
                  className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">{reasonLabel(c.reason)}</span>
                    <span
                      className={`text-xs font-medium ${status === "OPEN" ? "text-primary" : "text-muted-foreground"}`}
                    >
                      {status === "OPEN" ? "Open" : status === "BLOCKED" ? "Blocked" : "Closed"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.vehicle.name}</p>
                  {last && (
                    <p className="truncate text-sm text-muted-foreground">
                      {last.senderType === "OWNER" ? "You: " : ""}
                      {last.body}
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
