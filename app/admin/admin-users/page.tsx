import Link from "next/link";
import { requirePermission } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { AdminActionDialog } from "@/components/admin/AdminActionDialog";
import { changeUserRole } from "@/lib/admin/actions";
import { ASSIGNABLE_ROLES } from "@/lib/admin/permissions";
import { UserCog } from "lucide-react";

export const metadata = { title: "Admin Users — PingMyCar Admin" };

const STAFF_ROLES = ["SUPPORT", "MODERATOR", "OPERATIONS", "ANALYST", "ADMIN", "SUPER_ADMIN"] as const;

export default async function AdminUsersAdminPage() {
  await requirePermission("ADMIN_USER_MANAGE"); // SUPER_ADMIN-only by the map

  const staff = await prisma.user.findMany({
    where: { adminRole: { in: [...STAFF_ROLES] } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      adminRole: true,
      suspendedAt: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Governance"
        title="Admin Users"
        description="Every account with a staff role. Role changes require a reason and are audited."
      />

      {staff.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-12 text-center">
          <UserCog className="h-8 w-8 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">
            No staff accounts yet. Elevate a user from their detail page.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {staff.map((u) => (
            <li key={u.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <Link href={`/admin/users/${u.id}`} className="font-medium text-primary hover:underline">
                  {u.name}
                </Link>
                <span className="text-muted-foreground">{u.email}</span>
                <Badge variant={u.adminRole === "SUPER_ADMIN" ? "default" : "secondary"}>{u.adminRole}</Badge>
                {u.suspendedAt && <Badge variant="danger">Suspended</Badge>}
                <time dateTime={u.createdAt.toISOString()} className="ml-auto text-xs text-muted-foreground">
                  joined {u.createdAt.toLocaleDateString("en-IN", { dateStyle: "medium" })}
                </time>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {ASSIGNABLE_ROLES.filter((r) => r !== u.adminRole).map((role) => (
                  <AdminActionDialog
                    key={role}
                    label={`→ ${role}`}
                    title={`Change role to ${role}?`}
                    description={`This account currently holds ${u.adminRole}. The role change takes effect on their next server-side session check and is audited.`}
                    confirmLabel="Confirm Role Change"
                    action={(reason) => changeUserRole(u.id, role, reason)}
                  />
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
