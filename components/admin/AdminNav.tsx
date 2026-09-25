"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Car,
  MessageSquare,
  Flag,
  Sticker,
  ShoppingBag,
  BarChart3,
  ScrollText,
  ShieldAlert,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Permission } from "@/lib/admin/permissions";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: Permission;
  /** True while the section's page doesn't exist yet — rendered as a
   *  disabled "soon" span instead of a link, so no in-shell nav can 404. */
  disabled?: boolean;
};

export const ADMIN_NAV: readonly AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, permission: "ANALYTICS_READ" },
  { href: "/admin/users", label: "Users", icon: Users, permission: "USER_READ" },
  { href: "/admin/vehicles", label: "Vehicles", icon: Car, permission: "VEHICLE_READ" },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare, permission: "MESSAGE_READ_METADATA" },
  { href: "/admin/reports", label: "Reports", icon: Flag, permission: "REPORT_READ" },
  { href: "/admin/stickers", label: "Stickers", icon: Sticker, permission: "STICKER_READ", disabled: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag, permission: "ORDER_READ", disabled: true },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, permission: "ANALYTICS_READ", disabled: true },
  { href: "/admin/activity", label: "Activity Logs", icon: ScrollText, permission: "AUDIT_LOG_READ" },
  { href: "/admin/security", label: "Security", icon: ShieldAlert, permission: "SECURITY_READ" },
  { href: "/admin/admin-users", label: "Admin Users", icon: UserCog, permission: "ADMIN_USER_MANAGE" },
];

export function AdminSidebarNav({ permissions }: { permissions: readonly Permission[] }) {
  const pathname = usePathname();
  const allowed = ADMIN_NAV.filter((item) => permissions.includes(item.permission));

  return (
    <nav aria-label="Admin" className="space-y-1">
      {allowed.map(({ href, label, icon: Icon, disabled }) => {
        const active = disabled ? false : href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

        const className = cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
          disabled && "cursor-not-allowed opacity-50 hover:bg-transparent"
        );

        if (disabled) {
          return (
            <span key={href} className={className} aria-disabled="true" title="Coming soon">
              <Icon className="h-4 w-4" aria-hidden />
              {label}
              <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground/60">soon</span>
            </span>
          );
        }

        return (
          <Link key={href} href={href} className={className} aria-current={active ? "page" : undefined}>
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
