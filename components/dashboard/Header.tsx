import Link from "next/link";
import { QrCode } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";

export function DashboardHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2" aria-label="PingMyCar dashboard">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <QrCode className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-lg font-semibold tracking-tight">PingMyCar</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex" aria-label="Dashboard">
          <Link href="/dashboard/vehicles" className="hover:text-foreground">
            Vehicles
          </Link>
        </nav>

        <LogoutButton />
      </div>
    </header>
  );
}
