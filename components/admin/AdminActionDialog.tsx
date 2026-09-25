"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/admin/actions";

/**
 * Confirmation + reason dialog for sensitive admin actions. The server
 * action is invoked on submit; loading and error states render in place.
 * The dialog is a native <details> element — no extra client dependencies.
 */
export function AdminActionDialog({
  label,
  title,
  description,
  confirmLabel,
  destructive,
  action,
  doneRedirect,
}: {
  label: string;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  /** Server action; receives the reason typed by the admin. */
  action: (reason: string) => Promise<ActionResult>;
  /** Optional route to navigate to after success. */
  doneRedirect?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const result = await action(reason);
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setReason("");
    if (doneRedirect) router.push(doneRedirect);
    router.refresh();
  }

  return (
    <details
      className="group rounded-lg border border-border"
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary
        className={`inline-flex cursor-pointer list-none items-center rounded-md px-3 py-2 text-sm font-medium [&::-webkit-details-marker]:hidden ${
          destructive
            ? "bg-danger/10 text-danger hover:bg-danger/20"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
        }`}
      >
        {label}
      </summary>
      <form onSubmit={handleSubmit} className="mt-3 space-y-3 border-t border-border pt-3">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div>
          <label htmlFor={`reason-${label.replace(/\s+/g, "-")}`} className="mb-1 block text-xs font-medium text-muted-foreground">
            Reason (required)
          </label>
          <textarea
            id={`reason-${label.replace(/\s+/g, "-")}`}
            className="min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            minLength={4}
            required
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" size="sm" variant={destructive ? "destructive" : "default"} disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {confirmLabel}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancel
          </Button>
        </div>
      </form>
    </details>
  );
}

export function AdminActionRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-3">{children}</div>;
}
