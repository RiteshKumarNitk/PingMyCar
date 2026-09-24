import Link from "next/link";
import { requirePermission } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminActionDialog } from "@/components/admin/AdminActionDialog";
import { updateReportStatus } from "@/lib/admin/actions";
import { roleHasPermission } from "@/lib/admin/permissions";
import { Flag } from "lucide-react";

export const metadata = { title: "Reports — Admin" };

type SearchParams = Promise<{ status?: string }>;

const STATUSES = ["NEW", "INVESTIGATING", "RESOLVED", "DISMISSED"] as const;
type Status = (typeof STATUSES)[number];

const STATUS_VARIANT: Record<Status, "warning" | "secondary" | "success" | "outline"> = {
  NEW: "warning",
  INVESTIGATING: "secondary",
  RESOLVED: "success",
  DISMISSED: "outline",
};

export default async function AdminReportsPage({ searchParams }: { searchParams: SearchParams }) {
  const admin = await requirePermission("REPORT_READ");
  const params = await searchParams;
  const statusFilter = STATUSES.includes(params.status as Status) ? (params.status as Status) : undefined;
  const canManage = roleHasPermission(admin.role, "REPORT_MANAGE");

  const reports = await prisma.report.findMany({
    where: statusFilter ? { status: statusFilter } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      conversation: {
        select: {
          id: true,
          reason: true,
          status: true,
          vehicle: { select: { name: true, ownerId: true, owner: { select: { name: true } } } },
        },
      },
    },
  });

  const openCount = await prisma.report.count({ where: { status: "NEW" } });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Moderation"
        title="Reports"
        description={`${openCount} new report${openCount === 1 ? "" : "s"} awaiting triage.`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant={statusFilter ? "outline" : "secondary"} size="sm">
              <Link href="/admin/reports">All</Link>
            </Button>
            {STATUSES.map((s) => (
              <Button key={s} asChild variant={statusFilter === s ? "secondary" : "outline"} size="sm">
                <Link href={`/admin/reports?status=${s}`}>{s.charAt(0) + s.slice(1).toLowerCase()}</Link>
              </Button>
            ))}
          </div>
        }
      />

      {reports.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-12 text-center">
          <Flag className="h-8 w-8 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">No reports in this view.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {reports.map((report) => (
            <li key={report.id} className="space-y-3 rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <Badge variant={STATUS_VARIANT[report.status]}>{report.status}</Badge>
                <span className="font-medium">{report.conversation.vehicle.name}</span>
                <span className="text-xs text-muted-foreground">
                  conversation {report.conversation.reason} · {report.conversation.status}
                </span>
                <Link
                  href={`/admin/users/${report.conversation.vehicle.ownerId}`}
                  className="text-xs text-primary hover:underline"
                >
                  owner: {report.conversation.vehicle.owner.name}
                </Link>
                <time dateTime={report.createdAt.toISOString()} className="ml-auto text-xs text-muted-foreground">
                  {report.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </time>
              </div>

              <p className="text-sm">
                <span className="font-medium">Visitor reason for report:</span>{" "}
                {report.reason ?? "—"}
              </p>
              {report.adminNotes && (
                <p className="text-sm text-muted-foreground">Admin notes: {report.adminNotes}</p>
              )}

              {canManage && (
                <div className="flex flex-wrap gap-2">
                  {report.status === "NEW" && (
                    <AdminActionDialog
                      label="Investigate"
                      title="Move this report to INVESTIGATING?"
                      description="The report will be marked as under investigation and assigned to you."
                      confirmLabel="Investigate"
                      action={(notes) => updateReportStatus(report.id, "INVESTIGATING", notes)}
                    />
                  )}
                  {(report.status === "NEW" || report.status === "INVESTIGATING") && (
                    <>
                      <AdminActionDialog
                        label="Resolve"
                        title="Resolve this report?"
                        description="The report will be closed as RESOLVED with your notes on the outcome."
                        confirmLabel="Resolve"
                        action={(notes) => updateReportStatus(report.id, "RESOLVED", notes)}
                      />
                      <AdminActionDialog
                        label="Dismiss"
                        title="Dismiss this report?"
                        description="The report will be closed as DISMISSED with your notes on why no action was taken."
                        confirmLabel="Dismiss"
                        action={(notes) => updateReportStatus(report.id, "DISMISSED", notes)}
                      />
                    </>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
