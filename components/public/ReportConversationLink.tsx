"use client";

import { useState, type FormEvent } from "react";

export function ReportConversationLink({ visitorToken }: { visitorToken: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p className="rounded-lg border border-success/30 bg-success-bg px-3 py-2 text-center text-xs font-medium text-success">
        Reported. Thank you for letting us know.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        className="mx-auto block text-xs text-muted-foreground underline-offset-4 hover:underline"
        onClick={() => setOpen(true)}
      >
        Something wrong with this conversation? Report it
      </button>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    await fetch(`/api/public/conversations/${visitorToken}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reason.trim() || undefined }),
    }).catch(() => {});
    setSending(false);
    setDone(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-md border border-border bg-muted px-3 py-2">
      <textarea
        className="w-full rounded-md border border-input bg-transparent px-2 py-1.5 text-xs shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
        rows={2}
        placeholder="What's wrong with this conversation? (optional)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={500}
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="text-xs text-muted-foreground hover:underline"
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={sending}
          className="text-xs font-medium text-destructive hover:underline disabled:opacity-50"
        >
          {sending ? "Sending…" : "Submit report"}
        </button>
      </div>
    </form>
  );
}
