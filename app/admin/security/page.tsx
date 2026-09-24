import Link from "next/link";
import { requirePermission } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export const metadata = { title: "Security — Admin" };

type SearchParams = Promise<{ category?: string; range?: string; page?: string }>;

const PAGE_SIZE = 30;

const CATEGORIES = [
  { id: "AUTH", label: "Authentication" },
  { id: "SECURITY", label: "Authorization & Abuse" },
  { id: "ADMIN", label: "Admin Actions" },
  { id: "SYSTEM", label: "System Errors" },
] as const;

const RANGES = ["today", "7d", "30d"] as const;

function rangeStart(range: string | undefined): Date | undefined {
  const now = new Date();
  if (range === "today") {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (range === "7d") return new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  if (range === "30d") return new Date(now.getTime() - 30 * 24 * 3600 * 1000);
  return undefined;
}

export default async function AdminSecurityPage({ searchParams }: { searchParams: SearchParams }) {
  await requirePermission("SECURITY_READ");
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const category = CATEGORIES.some((c) => c.id === params.category) ? params.category : undefined;
  const range = RANGES.includes(params.range as (typeof RANGES)[number]) ? params.range : undefined;

  const where = {
    ...(category === "SECURITY"
      ? { category: "SECURITY" }
      : category
        ? { category }
        : { category: { in: ["AUTH", "SECURITY", "ADMIN", "SYSTEM"] } }),
    ...(rangeStart(range) ? { createdAt: { gte: rangeStart(range) } } : {}),
  };

  const [events, total, warnCount, critCount] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.count({ where: { ...where, severity: "WARNING" } }),
    prisma.auditLog.count({ where: { ...where, severity: { in: ["ERROR", "CRITICAL"] } } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (overrides: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { ...params, ...overrides };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Security"
        title="Security Center"
        description={`${warnCount} warnings · ${critCount} errors/critical in the selected range.`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant={!range ? "secondary" : "outline"} size="sm">
              <Link href={`/admin/security${qs({ range: undefined, page: undefined })}`}>All time</Link>
            </Button>
            {RANGES.map((r) => (
              <Button key={r} asChild variant={range === r ? "secondary" : "outline"} size="sm">
                <Link href={`/admin/security${qs({ range: r, page: undefined })}`}>
                  {r === "today" ? "Today" : r === "7d" ? "7 Days" : "30 Days"}
                </Link>
              </Button>
            ))}
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Button asChild variant={!category ? "secondary" : "outline"} size="sm">
          <Link href={`/admin/security${qs({ category: undefined, page: undefined })}`}>All</Link>
        </Button>
        {CATEGORIES.map((c) => (
          <Button key={c.id} asChild variant={category === c.id ? "secondary" : "outline"} size="sm">
            <Link href={`/admin/security${qs({ category: c.id, page: undefined })}`}>{c.label}</Link>
          </Button>
        ))}
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-12 text-center">
          <ShieldAlert className="h-8 w-8 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">No security events in this view.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {events.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-border bg-card px-4 py-3 text-sm">
              <time dateTime={e.createdAt.toISOString()} className="shrink-0 font-mono text-xs text-muted-foreground">
                {e.createdAt.toLocaleString("en-GB", { hour12: false })}
              </time>
              <span className="font-medium">{e.action}</span>
              <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{e.category}</span>
              <span className="text-xs text-muted-foreground">{e.actorType}</span>
              <Badge variant={e.result === "SUCCESS" ? "success" : e.result === "DENIED" ? "warning" : "danger"}>
                {e.result}
              </Badge>
              <Badge variant={e.severity === "INFO" ? "secondary" : e.severity === "WARNING" ? "warning" : "danger"}>
                {e.severity}
              </Badge>
              {e.reason && <span className="text-xs text-muted-foreground">“{e.reason.slice(0, 80)}”</span>}
              <span className="ml-auto font-mono text-xs text-muted-foreground">req {e.requestId?.slice(0, 8) ?? "—"}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Page {page} of {totalPages} · {total.toLocaleString()} events</p>
        <div className="flex gap-2">
          {page > 1 && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/security${qs({ page: String(page - 1) })}`}>Previous</Link>
            </Button>
          )}
          {page < totalPages && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/security${qs({ page: String(page + 1) })}`}>Next</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
