"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, House, MessageSquare, QrCode, Settings, UserRound, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; short: string; icon: LucideIcon; match: (p: string) => boolean };

/** Owner navigation — the same five destinations on desktop and mobile. */
export const DASHBOARD_NAV: readonly NavItem[] = [
  { href: "/dashboard", label: "Home", short: "Home", icon: House, match: (p) => p === "/dashboard" },
  {
    href: "/dashboard/messages",
    label: "Messages",
    short: "Messages",
    icon: MessageSquare,
    match: (p) => p.startsWith("/dashboard/messages"),
  },
  {
    href: "/dashboard/vehicles",
    label: "Vehicles",
    short: "Vehicles",
    icon: Car,
    match: (p) => p.startsWith("/dashboard/vehicles"),
  },
  {
    href: "/dashboard/stickers",
    label: "QR & Stickers",
    short: "QR",
    icon: QrCode,
    match: (p) => p.startsWith("/dashboard/stickers"),
  },
  {
    href: "/dashboard/profile",
    label: "Profile",
    short: "Profile",
    icon: UserRound,
    match: (p) => p.startsWith("/dashboard/profile"),
  },
];

const SETTINGS: NavItem = {
  href: "/dashboard/settings",
  label: "Settings",
  short: "Settings",
  icon: Settings,
  match: (p) => p.startsWith("/dashboard/settings"),
};

function UnreadCount({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex min-w-5 items-center justify-center rounded-full bg-comm px-1.5 text-[0.6875rem] leading-5 font-semibold text-white tabular-nums",
        className
      )}
    >
      {count > 99 ? "99+" : count}
      <span className="sr-only"> unread</span>
    </span>
  );
}

function SidebarLink({ item, pathname, unread = 0 }: { item: NavItem; pathname: string; unread?: number }) {
  const active = item.match(pathname);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-10 items-center gap-3 rounded-[10px] px-3 text-sm font-medium transition-colors",
        active ? "bg-primary-soft text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <Icon className="size-4.5" strokeWidth={active ? 2 : 1.75} aria-hidden />
      {item.label}
      <UnreadCount count={unread} className="ml-auto" />
    </Link>
  );
}

export function DashboardSidebarNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Owner" className="flex flex-col gap-1">
      {DASHBOARD_NAV.map((item) => (
        <SidebarLink
          key={item.href}
          item={item}
          pathname={pathname}
          unread={item.href === "/dashboard/messages" ? unreadCount : 0}
        />
      ))}
      <p className="px-3 pt-6 pb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
        Account
      </p>
      <SidebarLink item={SETTINGS} pathname={pathname} />
    </nav>
  );
}

/** Mobile bottom bar: five large targets, one-handed reach, safe-area aware. */
export function DashboardBottomNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Owner"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <div className="grid grid-cols-5">
        {DASHBOARD_NAV.map((item) => {
          const active =
            item.match(pathname) || (item.href === "/dashboard/profile" && SETTINGS.match(pathname));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              {active && <span aria-hidden className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-primary" />}
              <span className="relative">
                <Icon className="size-5.5" strokeWidth={active ? 2 : 1.75} aria-hidden />
                {item.href === "/dashboard/messages" && (
                  <UnreadCount count={unreadCount} className="absolute -top-1.5 -right-3 min-w-4.5 px-1 text-[0.625rem] leading-4.5" />
                )}
              </span>
              {item.short}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
