import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { needsOnboarding } from "@/lib/onboarding";
import { DashboardHeader } from "@/components/dashboard/Header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  if (await needsOnboarding(session.user)) redirect("/onboarding");

  return (
    <div className="min-h-dvh bg-background">
      <DashboardHeader />
      {children}
    </div>
  );
}
