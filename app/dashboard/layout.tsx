import { requireSession } from "@/lib/auth/session";
import { DashboardHeader } from "@/components/dashboard/Header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireSession();

  return (
    <div className="min-h-dvh bg-background">
      <DashboardHeader />
      {children}
    </div>
  );
}
