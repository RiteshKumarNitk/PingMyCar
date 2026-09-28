import Link from "next/link";
import { QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Brand mark: a QR tile on midnight navy with a teal "ping" dot.
 * `inverse` renders it for dark (navy) backgrounds.
 */
export function Logo({
  href = "/",
  compact = false,
  linked = true,
  inverse = false,
}: {
  href?: string;
  compact?: boolean;
  linked?: boolean;
  inverse?: boolean;
}) {
  const inner = (
    <>
      <span
        className={cn(
          "relative flex size-8 items-center justify-center rounded-[9px] text-white",
          inverse ? "bg-white/10 ring-1 ring-white/15" : "bg-navy"
        )}
      >
        <QrCode className="size-4.5" strokeWidth={1.75} aria-hidden />
        <span
          className={cn(
            "absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-comm ring-2",
            inverse ? "ring-navy" : "ring-background"
          )}
        />
      </span>
      {!compact && (
        <span className={cn("text-[1.0625rem] font-semibold tracking-tight", inverse && "text-white")}>PingMyCar</span>
      )}
    </>
  );

  if (!linked) {
    return <span className="flex items-center gap-2">{inner}</span>;
  }

  return (
    <Link href={href} className="flex items-center gap-2 rounded-md" aria-label={compact ? "PingMyCar" : "PingMyCar home"}>
      {inner}
    </Link>
  );
}
