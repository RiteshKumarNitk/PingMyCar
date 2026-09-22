import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { reasonLabel } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata = { title: "Vehicle Messages" };

export default async function VehicleMessagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();

  const vehicle = await prisma.vehicle.findFirst({
    where: { id, ownerId: session.user.id },
  });
  if (!vehicle) notFound();

  const conversations = await prisma.conversation.findMany({
    where: { vehicleId: vehicle.id },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Vehicle"
        title={`${vehicle.name} — Messages`}
        action={
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/vehicles/${vehicle.id}`}>Vehicle details</Link>
          </Button>
        }
      />

      {conversations.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No messages for this vehicle yet."
          description="When someone scans this vehicle's QR and sends a message, it will appear here."
        />
      ) : (
        <ul className="space-y-3">
          {conversations.map((c) => {
            const status = c.expiresAt < new Date() ? "CLOSED" : c.status;
            const last = c.messages[0];
            const unread = c.messages.some((m) => m.senderType === "VISITOR" && !m.readAt);
            return (
              <li key={c.id}>
                <Link
                  href={`/dashboard/messages/${c.id}`}
                  className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">{reasonLabel(c.reason)}</span>
                    <Badge
                      variant={status === "OPEN" ? "success" : status === "BLOCKED" ? "danger" : "secondary"}
                    >
                      {status === "OPEN" ? "Open" : status === "BLOCKED" ? "Blocked" : "Closed"}
                    </Badge>
                  </div>
                  {last && (
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {last.senderType === "OWNER" ? "You: " : ""}
                      {last.body}
                    </p>
                  )}
                  {unread && (
                    <Badge className="mt-2 px-2 py-0 text-[10px]">New message</Badge>
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
