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
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy/50 p-4 backdrop-blur-[2px] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-description"
      onClick={onClose}
    >
      <div
        className="animate-enter w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-raised sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning-bg text-warning">
            <AlertTriangle className="h-5 w-5" aria-hidden />
        </span>
          <div>
            <h2 id="confirm-modal-title" className="section-title">{title}</h2>
            <p id="confirm-modal-description" className="supporting mt-1">{description}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button ref={cancelRef} type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            loading={busy}
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
