"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Car, MessageSquare, Sticker, UserRound, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export const DASHBOARD_NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, match: (p: string) => p === "/dashboard" },
  {
    href: "/dashboard/vehicles",
    label: "My Vehicles",
    icon: Car,
    match: (p: string) => p.startsWith("/dashboard/vehicles"),
  },
  {
    href: "/dashboard/messages",
    label: "Messages",
    icon: MessageSquare,
    match: (p: string) => p.startsWith("/dashboard/messages"),
  },
  {
    href: "/dashboard/stickers",
    label: "Stickers",
    icon: Sticker,
    match: (p: string) => p.startsWith("/dashboard/stickers"),
  },
] as const;

const ACCOUNT_NAV = [
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

function isActive(href: string, pathname: string, match?: (p: string) => boolean) {
  return match ? match(pathname) : pathname === href;
}

export function DashboardSidebarNav({ adminHref }: { adminHref?: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Dashboard" className="flex h-full flex-col">
      <div className="space-y-1">
      {DASHBOARD_NAV.map(({ href, label, icon: Icon, match }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive(href, pathname, match)
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
          {label}
        </Link>
      ))}

      <div className="px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
        Account
      </div>
      {ACCOUNT_NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive(href, pathname)
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
          {label}
        </Link>
      ))}
      </div>

      {adminHref && (
        <Link
          href={adminHref}
          className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          Admin console
        </Link>
      )}
    </nav>
  );
}

export function DashboardBottomNav() {
  const pathname = usePathname();

  const items = [
    DASHBOARD_NAV[0],
    DASHBOARD_NAV[1],
    DASHBOARD_NAV[2],
    DASHBOARD_NAV[3],
  ];

  return (
    <nav
      aria-label="Dashboard"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden"
    >
      <div className="grid grid-cols-5">
        {items.map(({ href, label, icon: Icon, match }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
              isActive(href, pathname, match) ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
            {label === "My Vehicles" ? "Vehicles" : label}
          </Link>
        ))}
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
            pathname.startsWith("/dashboard/settings") || pathname.startsWith("/dashboard/profile")
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          <Settings className="h-5 w-5" aria-hidden />
          Settings
        </Link>
      </div>
    </nav>
  );
}
