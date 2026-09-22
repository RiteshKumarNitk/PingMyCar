import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { reasonLabel } from "@/types";
import { MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { EnableNotifications } from "@/components/dashboard/EnableNotifications";
import { cn } from "@/lib/utils";

export const metadata = { title: "Messages" };

const PAGE_SIZE = 20;

const TABS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "read", label: "Read" },
] as const;

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; vehicle?: string; cursor?: string }>;
}) {
  const session = await requireSession();
  const { tab = "all", vehicle: vehicleFilter, cursor } = await searchParams;

  // Unread filtering runs in SQL via existence predicates — never fetch full
  // threads to compute counts in JS.
  const tabFilter =
    tab === "unread"
      ? { messages: { some: { senderType: "VISITOR" as const, readAt: null } } }
      : tab === "read"
        ? { messages: { none: { senderType: "VISITOR" as const, readAt: null } } }
        : {};

  const conversations = await prisma.conversation.findMany({
    where: {
      vehicle: { ownerId: session.user.id },
      ...(vehicleFilter ? { vehicleId: vehicleFilter } : {}),
      ...tabFilter,
    },
    include: {
      vehicle: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = conversations.length > PAGE_SIZE;
  const page = hasMore ? conversations.slice(0, PAGE_SIZE) : conversations;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  // One aggregate query for unread counts of the conversations on this page.
  const unreadGroups = await prisma.message.groupBy({
    by: ["conversationId"],
    where: {
      conversationId: { in: page.map((c) => c.id) },
      senderType: "VISITOR",
      readAt: null,
    },
    _count: { _all: true },
  });
  const unreadByConversation = new Map(
    unreadGroups.map((g) => [g.conversationId, g._count._all])
  );

  // Global unread badge count — a single count over the composite index
  // (conversationId, senderType, readAt); indexed conversations keep it cheap.
  const unreadTotal = await prisma.message.count({
    where: {
      conversation: { vehicle: { ownerId: session.user.id } },
      senderType: "VISITOR",
      readAt: null,
    },
  });

  const withMeta = page.map((c) => {
    const unreadCount = unreadByConversation.get(c.id) ?? 0;
    const expired = c.expiresAt < new Date();
    const status = expired ? "CLOSED" : c.status;
    return { conversation: c, last: c.messages[0] ?? null, unreadCount, status };
  });

  const filterVehicle = vehicleFilter
    ? page.find((c) => c.vehicle.id === vehicleFilter)?.vehicle ?? null
    : null;

  function tabHref(key: string) {
    const params = new URLSearchParams();
    params.set("tab", key);
    if (vehicleFilter) params.set("vehicle", vehicleFilter);
    return `/dashboard/messages?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description="Private conversations about your vehicles."
      />

      <EnableNotifications />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1" role="tablist" aria-label="Filter messages">
          {TABS.map(({ key, label }) => (
            <Link
              key={key}
              href={tabHref(key)}
              role="tab"
              aria-selected={tab === key}
              className={cn(
                "rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
                tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
              {key === "unread" && unreadTotal > 0 && (
                <span className="ml-1.5 rounded-full bg-white/20 px-1.5 text-xs">
                  {unreadTotal}
                </span>
              )}
            </Link>
          ))}
        </div>

        {filterVehicle && (
          <Button asChild variant="ghost" size="sm">
            <Link href={`/dashboard/messages?tab=${tab}`}>
              Filter: {filterVehicle.name} ✕
            </Link>
          </Button>
        )}
      </div>

      {withMeta.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={tab === "unread" ? "You're all caught up." : "No messages here yet."}
          description={
            tab === "unread"
              ? "No unread messages. New ones will show up here."
              : "When someone scans your vehicle's QR and sends a message, it will appear here."
          }
        />
      ) : (
        <ul className="space-y-3">
          {withMeta.map(({ conversation: c, last, unreadCount, status }) => (
            <li key={c.id}>
              <Link
                href={`/dashboard/messages/${c.id}`}
                className={cn(
                  "block rounded-xl border bg-card p-4 transition-colors hover:border-primary/40",
                  unreadCount > 0 ? "border-primary/40" : "border-border"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={cn("text-sm", unreadCount > 0 ? "font-semibold" : "font-medium")}>
                    {reasonLabel(c.reason)}
                  </span>
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
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{c.vehicle.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {c.updatedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ·{" "}
                    {c.updatedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </span>
                  {unreadCount > 0 && (
                    <Badge className="px-2 py-0 text-[10px]">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {nextCursor && (
        <div className="flex justify-center pt-2">
          <Button asChild variant="outline">
            <Link
              href={`/dashboard/messages?tab=${tab}${vehicleFilter ? `&vehicle=${vehicleFilter}` : ""}&cursor=${nextCursor}`}
            >
              Load more
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
