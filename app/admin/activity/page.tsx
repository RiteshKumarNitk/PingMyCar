import Link from "next/link";
import { requirePermission } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollText, Search } from "lucide-react";

export const metadata = { title: "Activity Logs — PingMyCar Admin" };

const PAGE_SIZE = 25;

type SearchParams = Promise<{
  page?: string;
  action?: string;
  category?: string;
  severity?: string;
}>;

const SEVERITIES = ["INFO", "WARNING", "ERROR", "CRITICAL"] as const;
const CATEGORIES = [
  "AUTH",
  "USER",
  "VEHICLE",
  "QR",
  "MESSAGE",
  "REPORT",
  "ADMIN",
  "SECURITY",
  "SYSTEM",
] as const;

export default async function AdminActivityPage({ searchParams }: { searchParams: SearchParams }) {
  await requirePermission("AUDIT_LOG_READ");
  const params = await searchParams;

  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const where = {
    ...(params.action ? { action: { contains: params.action } } : {}),
    ...(params.category ? { category: params.category } : {}),
    ...(params.severity
      ? { severity: params.severity as (typeof SEVERITIES)[number] }
      : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const buildQuery = (overrides: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const merged: Record<string, string | undefined> = { ...params, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v !== undefined && v !== "" && !(k === "page" && v === "1")) q.set(k, v);
    }
    const s = q.toString();
    return s ? `?${s}` : "";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Audit"
        title="Activity Logs"
        description={`${total.toLocaleString()} audit events. Filtered server-side; never loads the full table.`}
      />

      <form className="flex flex-wrap items-end gap-3" method="get">
        <div className="min-w-48 flex-1">
          <label htmlFor="action" className="mb-1 block text-xs font-medium text-muted-foreground">
            Action contains
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
            <Input
              id="action"
              name="action"
              placeholder="e.g. AUTHZ_FAILURE"
              defaultValue={params.action ?? ""}
              className="pl-8"
            />
          </div>
        </div>
        <div>
          <label htmlFor="category" className="mb-1 block text-xs font-medium text-muted-foreground">
            Category
          </label>
          <select
            id="category"
            name="category"
            defaultValue={params.category ?? ""}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">All</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="severity" className="mb-1 block text-xs font-medium text-muted-foreground">
            Severity
          </label>
          <select
            id="severity"
            name="severity"
            defaultValue={params.severity ?? ""}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">All</option>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="secondary">Filter</Button>
      </form>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-12 text-center">
          <ScrollText className="h-8 w-8 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">No matching audit events.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Resource</th>
                <th className="px-4 py-3 font-medium">Result</th>
                <th className="px-4 py-3 font-medium">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/30">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
                    {log.createdAt.toLocaleString("en-GB", { hour12: false })}
                  </td>
                  <td className="px-4 py-3">
                    {log.actorType}
                    {log.actorId && (
                      <span className="ml-1 font-mono text-xs text-muted-foreground">
                        {log.actorId.slice(0, 8)}…
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{log.action}</td>
                  <td className="px-4 py-3">{log.category}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {log.resourceType ? `${log.resourceType} ${log.resourceId?.slice(0, 8) ?? ""}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={log.result === "SUCCESS" ? "success" : log.result === "DENIED" ? "warning" : "danger"}>
                      {log.result}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={log.severity === "INFO" ? "secondary" : log.severity === "WARNING" ? "warning" : "danger"}>
                      {log.severity}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          {page > 1 && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/activity${buildQuery({ page: String(page - 1) })}`}>Previous</Link>
            </Button>
          )}
          {page < totalPages && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/activity${buildQuery({ page: String(page + 1) })}`}>Next</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
