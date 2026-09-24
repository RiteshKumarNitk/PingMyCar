import { requirePermission } from "@/lib/admin/auth";
import { permissionsForRole } from "@/lib/admin/permissions";
import { bootstrapSuperAdmin } from "@/lib/admin/bootstrap";
import { Logo } from "@/components/shared/Logo";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Badge } from "@/components/ui/badge";
import { AdminSidebarNav } from "@/components/admin/AdminNav";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "PingMyCar Admin" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // ANALYTICS_READ is the minimum any admin page needs; pages with stricter
  // needs re-guard themselves with their own permission.
  const admin = await requirePermission("ANALYTICS_READ");

  // Server-side super-admin bootstrap: runs only for the INITIAL_SUPER_ADMIN_EMAIL
  // account while the env var is set; audited and idempotent. Returns the
  // effective role for this request — no re-query needed.
  const { role } = await bootstrapSuperAdmin(admin.user);
  const permissions = permissionsForRole(role);

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo href="/admin" />
            <Badge variant="secondary" className="gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden />
              {role === "SUPER_ADMIN" ? "Super Admin" : role.charAt(0) + role.slice(1).toLowerCase()}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Owner app
            </Link>
            <span className="hidden text-sm text-muted-foreground sm:block">{admin.user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-56 shrink-0 border-r border-border py-6 pr-4 md:block">
          <AdminSidebarNav permissions={permissions} />
        </aside>
        <div className="min-w-0 flex-1 px-4 pb-16 pt-8 sm:px-6">{children}</div>
      </div>
    </div>
  );
}
