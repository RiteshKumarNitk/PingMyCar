import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Useful empty state: what this list is for, and the one action that fills it. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  ctaHref,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-input bg-card/60 px-6 py-12 text-center sm:py-16">
      <span className="flex size-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Icon className="size-6" strokeWidth={1.75} aria-hidden />
      </span>
      <p className="section-title mt-4">{title}</p>
      <p className="supporting mt-1 max-w-sm">{description}</p>
      {ctaLabel && ctaHref && (
        <Button asChild className="mt-6">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      )}
    </div>
  );
}
