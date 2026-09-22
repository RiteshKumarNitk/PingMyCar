import Link from "next/link";
import { QrCode } from "lucide-react";

export function Logo({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2"
      aria-label={compact ? "PingMyCar" : "PingMyCar home"}
    >
      <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-navy text-white">
        <QrCode className="h-5 w-5" aria-hidden />
        {/* Brand accent dot — the "ping" */}
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
      </span>
      {!compact && <span className="text-lg font-semibold tracking-tight">PingMyCar</span>}
    </Link>
  );
}
