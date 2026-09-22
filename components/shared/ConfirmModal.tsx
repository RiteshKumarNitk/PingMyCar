"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  pendingLabel,
  busy = false,
  destructive = true,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel?: string;
  busy?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    cancelRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning-bg text-warning">
            <AlertTriangle className="h-5 w-5" aria-hidden />
        </span>
          <div>
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button ref={cancelRef} type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            size="sm"
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? (pendingLabel ?? "Working…") : confirmLabel}
          </Button>
        </div>
        {/* Escape focus management: the cancel button receives initial focus above */}
        <span className="sr-only">Press Escape to cancel.</span>
      </div>
    </div>
  );
}
