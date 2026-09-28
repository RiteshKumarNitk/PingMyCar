import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/admin/auth";
import { roleHasPermission } from "@/lib/admin/permissions";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { reasonLabel } from "@/types";

export const metadata = { title: "Conversations — Admin" };

type SearchParams = Promise<{ page?: string; q?: string; status?: string; reported?: string }>;

const PAGE_SIZE = 50;
const STATUSES = ["OPEN", "CLOSED", "BLOCKED"] as const;
const OPEN_REPORT = { status: { in: ["NEW" as const, "INVESTIGATING" as const] } };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fmt(d: Date) {
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

/**
 * Metadata-only conversation index. Message bodies are never loaded here —
 * content is revealed per conversation on the detail page, behind
 * MESSAGE_READ_CONTENT and an audited reason.
 */
export default async function AdminConversationsPage({ searchParams }: { searchParams: SearchParams }) {
  const admin = await requirePermission("MESSAGE_READ_METADATA");
  const canSeeOwners = roleHasPermission(admin.role, "USER_READ");
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const q = params.q?.trim().slice(0, 100) ?? "";
  const status = STATUSES.find((s) => s === params.status);
  const reportedOnly = params.reported === "1";

  const where: Prisma.ConversationWhereInput = {
    ...(status ? { status } : {}),
    ...(reportedOnly ? { reports: { some: OPEN_REPORT } } : {}),
    ...(q
      ? UUID_RE.test(q)
        ? { id: q }
        : {
            vehicle: {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { registrationNumber: { contains: q, mode: "insensitive" } },
                { publicToken: { equals: q.toUpperCase() } },
                // Owner search only for admins allowed to see user records.
                ...(canSeeOwners
                  ? [
                      { owner: { name: { contains: q, mode: "insensitive" as const } } },
                      { owner: { email: { contains: q, mode: "insensitive" as const } } },
                    ]
                  : []),
              ],
            },
          }
      : {}),
  };

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: {
        id: true,
        reason: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        expiresAt: true,
        vehicle: { select: { name: true, ownerId: true, owner: { select: { name: true } } } },
        _count: { select: { messages: true, reports: { where: OPEN_REPORT } } },
      },
    }),
    prisma.conversation.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (overrides: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    const merged = { q: q || undefined, status, reported: reportedOnly ? "1" : undefined, ...overrides };
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, v);
    const str = sp.toString();
    return str ? `/admin/messages?${str}` : "/admin/messages";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Moderation"
        title="Conversations"
        description={`${total.toLocaleString()} conversations. Metadata only — message content requires permission and a logged reason.`}
      />

      <form className="flex flex-wrap items-end gap-3" action="/admin/messages">
        <div className="min-w-56 flex-1">
          <label htmlFor="q" className="mb-1 block text-xs font-medium text-muted-foreground">
            Search {canSeeOwners ? "vehicle, registration, QR token, owner, or conversation ID" : "vehicle, registration, QR token, or conversation ID"}
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          />
        </div>
        <div>
          <label htmlFor="status" className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
          <select id="status" name="status" defaultValue={status ?? ""} className="h-9 rounded-md border border-input bg-transparent px-2 text-sm">
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>
        <label className="flex h-9 items-center gap-2 text-sm">
          <input type="checkbox" name="reported" value="1" defaultChecked={reportedOnly} />
          Open reports only
        </label>
        <button type="submit" className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
          Filter
        </button>
      </form>

      {conversations.length === 0 ? (
        <p className="text-sm text-muted-foreground">No conversations match.</p>
      ) : (
        <ul className="space-y-3">
          {conversations.map((c) => {
            const expired = c.expiresAt < new Date();
            const shownStatus = expired && c.status === "OPEN" ? "CLOSED" : c.status;
            return (
              <li key={c.id} className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/messages/${c.id}`} className="font-medium text-primary hover:underline">
                    {reasonLabel(c.reason)}
                  </Link>
                  <Badge variant={shownStatus === "OPEN" ? "success" : shownStatus === "BLOCKED" ? "danger" : "secondary"}>
                    {shownStatus}
                  </Badge>
                  {c._count.reports > 0 && <Badge variant="danger">{c._count.reports} open report(s)</Badge>}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{c.vehicle.name}</span>
                  {canSeeOwners && (
                    <Link href={`/admin/users/${c.vehicle.ownerId}`} className="text-primary hover:underline">
                      {c.vehicle.owner.name}
                    </Link>
                  )}
                  <span>{c._count.messages} message(s)</span>
                  <span>Last activity {fmt(c.updatedAt)}</span>
                  <span className="ml-auto font-mono">{c.id.slice(0, 8)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
        <div className="flex gap-2">
          {page > 1 && (
            <Link href={qs({ page: String(page - 1) })} className="text-sm text-primary hover:underline">Previous</Link>
          )}
          {page < totalPages && (
            <Link href={qs({ page: String(page + 1) })} className="text-sm text-primary hover:underline">Next</Link>
          )}
        </div>
      </div>
    </div>
  );
}
