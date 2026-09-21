import Link from "next/link";
import { QrCode } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2" aria-label="PingMyCar home">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <QrCode className="h-5 w-5" aria-hidden />
        </span>
        <span className="text-lg font-semibold tracking-tight">PingMyCar</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
