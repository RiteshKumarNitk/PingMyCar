import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <Logo />

      <div className="mt-8 w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-lg shadow-navy/5 sm:p-8">
        {children}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Free to join · No app required · Private messaging
      </p>

      <Link href="/" className="mt-4 text-xs text-muted-foreground underline-offset-4 hover:underline">
        ← Back to pingmycar.app
      </Link>
    </div>
  );
}
