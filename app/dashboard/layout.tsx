import { requireSession } from "@/lib/auth/session";
import { needsOnboarding } from "@/lib/onboarding";
import { redirect } from "next/navigation";
import { Logo } from "@/components/shared/Logo";
import { LogoutButton } from "@/components/auth/LogoutButton";
import {
  DashboardSidebarNav,
  DashboardBottomNav,
} from "@/components/dashboard/DashboardNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  if (await needsOnboarding(session.user)) redirect("/onboarding");

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:block">
              {session.user.name}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl">
        <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-56 shrink-0 border-r border-border py-6 pr-4 md:block">
          <DashboardSidebarNav />
        </aside>

        <div className="min-w-0 flex-1 px-4 pb-28 pt-8 sm:px-6 md:pb-12">{children}</div>
      </div>

      <DashboardBottomNav />
    </div>
  );
}
