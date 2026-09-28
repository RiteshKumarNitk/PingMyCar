import Link from "next/link";
import { Ban, CloudOff, Lock, SearchX, ServerCrash, TimerReset, TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ERROR_COPY, type ErrorKind } from "@/lib/ui/errors";

const ICONS: Record<`${ErrorKind}`, LucideIcon> = {
  "401": Lock,
  "403": Ban,
  "404": SearchX,
  "409": TriangleAlert,
  "422": TriangleAlert,
  "429": TimerReset,
  "500": ServerCrash,
  network: CloudOff,
};

/** Full-panel error: what happened and what to do next. Never technical detail. */
export function ErrorState({
  kind,
  title,
  description,
  primary,
  secondary,
}: {
  kind: ErrorKind;
  title?: string;
  description?: string;
  primary?: { label: string; href?: string; onClick?: () => void };
  secondary?: { label: string; href: string };
}) {
  const key = String(kind) as `${ErrorKind}`;
  const copy = ERROR_COPY[key];
  const Icon = ICONS[key];
  return (
    <div className="flex flex-col items-center px-4 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-surface-2 text-muted-foreground">
        <Icon className="size-7" strokeWidth={1.75} aria-hidden />
      </span>
      <h1 className="page-title mt-5">{title ?? copy.title}</h1>
      <p className="supporting mt-2 max-w-sm">{description ?? copy.description}</p>
      {(primary || secondary) && (
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {primary &&
            (primary.href ? (
              <Button asChild>
                <Link href={primary.href}>{primary.label}</Link>
              </Button>
            ) : (
              <Button onClick={primary.onClick}>{primary.label}</Button>
            ))}
          {secondary && (
            <Button asChild variant="outline">
              <Link href={secondary.href}>{secondary.label}</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
