import { requireSession } from "@/lib/auth/session";
import { needsOnboarding, isStaffRole } from "@/lib/onboarding";
import { bootstrapSuperAdmin } from "@/lib/admin/bootstrap";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { LogoutButton } from "@/components/auth/LogoutButton";
import {
  DashboardSidebarNav,
  DashboardBottomNav,
} from "@/components/dashboard/DashboardNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  await bootstrapSuperAdmin({ id: session.user.id, email: session.user.email });

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { adminRole: true },
  });

  if (await needsOnboarding(session.user)) redirect("/onboarding");

  // Unread badge for the nav — the same indexed count the inbox uses.
  const unreadCount = await prisma.message.count({
    where: { conversation: { vehicle: { ownerId: session.user.id } }, senderType: "VISITOR", readAt: null },
  });
  const isStaff = isStaffRole(me?.adminRole);
  const initial = (session.user.name?.trim()?.[0] ?? "?").toUpperCase();

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Logo href="/dashboard" />
          <div className="flex items-center gap-2 sm:gap-3">
            {isStaff && (
              // Staff-only, kept out of the owner navigation on purpose.
              <Link
                href="/admin"
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-navy/15 bg-navy px-3 text-xs font-medium text-white hover:bg-navy-3"
              >
                <ShieldCheck className="size-3.5" aria-hidden />
                Admin
              </Link>
            )}
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2 rounded-full py-1 pr-1 pl-1 sm:pr-3"
              aria-label="Your profile"
            >
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt="" className="size-8 rounded-full object-cover" />
              ) : (
                <span className="flex size-8 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                  {initial}
                </span>
              )}
              <span className="hidden max-w-40 truncate text-sm font-medium sm:block">{session.user.name}</span>
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-60 shrink-0 border-r border-border px-3 py-6 md:block">
          <DashboardSidebarNav unreadCount={unreadCount} />
        </aside>

        <main className="animate-enter min-w-0 flex-1 px-4 pt-6 pb-28 sm:px-6 sm:pt-8 md:pb-12 lg:px-10">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>

      <DashboardBottomNav unreadCount={unreadCount} />
    </div>
  );
}
