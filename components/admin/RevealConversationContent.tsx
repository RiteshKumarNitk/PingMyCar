"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ContentResult, RevealedMessage } from "@/lib/admin/actions";

/**
 * Reason-gated message reveal. Content only exists client-side after the
 * server action has checked MESSAGE_READ_CONTENT and written the
 * ADMIN_VIEWED_MESSAGE_CONTENT audit event; it is never server-rendered.
 */
export function RevealConversationContent({
  action,
}: {
  action: (reason: string) => Promise<ContentResult>;
}) {
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<RevealedMessage[] | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const result = await action(reason);
    setPending(false);
    if (!result.ok) setError(result.error);
    else setMessages(result.messages);
  }

  if (messages) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Access recorded as ADMIN_VIEWED_MESSAGE_CONTENT. Content is not stored in the audit log.
        </p>
        {messages.length === 0 && <p className="text-sm text-muted-foreground">No messages.</p>}
        <ul className="space-y-2">
          {messages.map((m, i) => (
            <li key={i} className="rounded-md border border-border px-3 py-2 text-sm">
              <p className="text-xs text-muted-foreground">
                {m.senderType === "OWNER" ? "Owner" : "Visitor"} · {new Date(m.createdAt).toLocaleString("en-IN")}
              </p>
              <p className="mt-1 whitespace-pre-wrap break-words">{m.body}</p>
            </li>
          ))}
        </ul>
        <Button type="button" size="sm" variant="ghost" onClick={() => setMessages(null)}>
          Hide content
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Message bodies are hidden. Revealing them records your reason in the audit log.
      </p>
      <div>
        <label htmlFor="reveal-reason" className="mb-1 block text-xs font-medium text-muted-foreground">
          Reason (required)
        </label>
        <textarea
          id="reveal-reason"
          className="min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          minLength={4}
          required
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="sm" disabled={pending}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        Reveal content
      </Button>
    </form>
  );
}
