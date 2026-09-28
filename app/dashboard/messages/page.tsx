import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { reasonLabel } from "@/types";
import { Car, MessageSquare, X } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
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
      // Report indicator only (open reports) — no report content is loaded.
      _count: { select: { reports: { where: { status: { in: ["NEW", "INVESTIGATING"] } } } } },
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
    return { conversation: c, last: c.messages[0] ?? null, unreadCount, status, reported: c._count.reports > 0 };
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
        description="Private conversations about your vehicles. Visitors never see your contact details."
      />

      <EnableNotifications />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex gap-1 rounded-[10px] border border-border bg-card p-1 shadow-card" role="tablist" aria-label="Filter messages">
          {TABS.map(({ key, label }) => (
            <Link
              key={key}
              href={tabHref(key)}
              role="tab"
              aria-selected={tab === key}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-md px-3.5 text-sm font-medium transition-colors",
                tab === key ? "bg-primary-soft text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
              {key === "unread" && unreadTotal > 0 && (
                <span className="rounded-full bg-comm px-1.5 text-[0.6875rem] leading-5 font-semibold text-white tabular-nums">
                  {unreadTotal}
                </span>
              )}
            </Link>
          ))}
        </div>

        {filterVehicle && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/messages?tab=${tab}`} aria-label={`Remove filter ${filterVehicle.name}`}>
              <Car aria-hidden />
              {filterVehicle.name}
              <X aria-hidden />
            </Link>
          </Button>
        )}
      </div>

      {withMeta.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={tab === "unread" ? "You're all caught up" : "No messages yet"}
          description={
            tab === "unread"
              ? "No unread messages. New ones will show up here."
              : "When someone scans your QR code, their message will appear here."
          }
        />
      ) : (
        <ul className="surface divide-y divide-border overflow-hidden">
          {withMeta.map(({ conversation: c, last, unreadCount, status, reported }) => (
            <li key={c.id}>
              <Link
                href={`/dashboard/messages/${c.id}`}
                className="flex gap-3 px-4 py-4 transition-colors hover:bg-accent/60 sm:px-5"
              >
                <span
                  aria-hidden
                  className={cn("mt-1.5 size-2 shrink-0 rounded-full", unreadCount > 0 ? "bg-comm" : "bg-transparent")}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className={cn("truncate text-[0.9375rem]", unreadCount > 0 ? "font-semibold" : "font-medium")}>
                      {reasonLabel(c.reason)}
                    </span>
                    <time dateTime={c.updatedAt.toISOString()} className="meta shrink-0">
                      {c.updatedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ·{" "}
                      {c.updatedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </time>
                  </div>
                  <p className="meta mt-0.5 flex items-center gap-1.5 truncate">
                    <Car className="size-3.5 shrink-0" aria-hidden />
                    {c.vehicle.name}
                  </p>
                  {last && (
                    <p className={cn("mt-1.5 truncate text-sm", unreadCount > 0 ? "text-foreground/85" : "text-muted-foreground")}>
                      {last.senderType === "OWNER" ? "You: " : ""}
                      {last.body}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {unreadCount > 0 && <StatusBadge status="unread" label={`${unreadCount} new`} />}
                    {status !== "OPEN" && <StatusBadge status={status === "BLOCKED" ? "blocked" : "closed"} />}
                    {reported && <StatusBadge status="reported" />}
                  </div>
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
