import { requirePermission } from "@/lib/admin/auth";
import { permissionsForRole } from "@/lib/admin/permissions";
import { bootstrapSuperAdmin } from "@/lib/admin/bootstrap";
import { Logo } from "@/components/shared/Logo";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { AdminMobileNav, AdminSidebarNav } from "@/components/admin/AdminNav";
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
      {/* Admin chrome is midnight navy so it is never mistaken for the owner app. */}
      <header className="sticky top-0 z-40 bg-navy text-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Logo href="/admin" inverse />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/85 ring-1 ring-white/15">
              <ShieldCheck className="size-3.5 text-comm" aria-hidden />
              {role === "SUPER_ADMIN" ? "Super Admin" : role.charAt(0) + role.slice(1).toLowerCase()}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/dashboard" className="hidden rounded-md text-sm font-medium text-white/70 hover:text-white sm:block">
              Owner app
            </Link>
            <span className="hidden max-w-56 truncate text-sm text-white/60 lg:block">{admin.user.email}</span>
            <div className="[&_button]:text-white/80 [&_button:hover]:bg-white/10 [&_button:hover]:text-white">
              <LogoutButton />
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 md:hidden">
          <AdminMobileNav permissions={permissions} />
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 border-r border-border bg-card px-3 py-6 md:block">
          <p className="px-3 pb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
            Admin console
          </p>
          <AdminSidebarNav permissions={permissions} />
        </aside>
        <main className="min-w-0 flex-1 px-4 pt-6 pb-16 sm:px-6 sm:pt-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
