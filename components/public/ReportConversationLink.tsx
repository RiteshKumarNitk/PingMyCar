"use client";

import { useState, type FormEvent } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ReportConversationLink({ visitorToken }: { visitorToken: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p role="status" className="rounded-lg bg-success-bg px-3 py-2.5 text-center text-sm font-medium text-success">
        Reported. Thank you for letting us know.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        className="mx-auto flex min-h-11 items-center gap-1.5 rounded-md px-3 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        onClick={() => setOpen(true)}
      >
        <Flag className="size-3.5" aria-hidden />
        Something wrong with this conversation? Report it
      </button>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (sending) return;
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
    <form onSubmit={handleSubmit} className="surface animate-enter space-y-3 p-4">
      <label htmlFor="reportReason" className="section-title block">
        Report this conversation
      </label>
      <Textarea
        id="reportReason"
        rows={2}
        className="min-h-20"
        placeholder="What's wrong? (optional)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={500}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" variant="destructive" loading={sending}>
          {sending ? "Sending…" : "Submit report"}
        </Button>
      </div>
    </form>
  );
}
