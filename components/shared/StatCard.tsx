import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Compact metric tile. With `href` the whole tile links to the list it counts. */
export function StatCard({
  icon: Icon,
  label,
  value,
  href,
  tone = "primary",
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  href?: string;
  tone?: "primary" | "comm" | "success";
  hint?: string;
}) {
  const toneClass = {
    primary: "bg-primary-soft text-primary",
    comm: "bg-comm-bg text-comm",
    success: "bg-success-bg text-success",
  }[tone];
  const body = (
    <>
      <div className="flex items-center gap-3">
        <span className={cn("flex size-9 items-center justify-center rounded-lg", toneClass)}>
          <Icon className="size-4.5" strokeWidth={1.75} aria-hidden />
        </span>
        <p className="text-sm text-muted-foreground">{label}</p>
        {href && <ChevronRight className="ml-auto size-4 text-muted-foreground/60" aria-hidden />}
      </div>
      <p className="mt-3 text-[1.75rem] leading-none font-semibold tracking-tight tabular-nums">{value}</p>
      {hint && <p className="meta mt-1.5">{hint}</p>}
    </>
  );
  const cls = "surface block p-4 sm:p-5";
  return href ? (
    <Link href={href} className={cn(cls, "transition-colors hover:border-primary/30")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
