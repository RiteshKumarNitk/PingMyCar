"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Lock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormMessage } from "@/components/ui/field";
import { friendlyError } from "@/lib/ui/errors";
import { cn } from "@/lib/utils";

type Message = { senderType: "VISITOR" | "OWNER"; body: string; createdAt: string | Date };

function formatTime(value: string | Date) {
  const d = new Date(value);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function MessageThread({
  submitUrl,
  messages,
  viewerRole,
  closed,
  closedLabel = "This conversation has ended.",
  maxChars,
  pollMs = 15000,
}: {
  /** Where a new reply is POSTed — the public visitor route or the owner route. */
  submitUrl: string;
  messages: Message[];
  /** Which senderType renders as "my own message" (right-aligned, primary color). */
  viewerRole: "VISITOR" | "OWNER";
  closed: boolean;
  closedLabel?: string;
  maxChars: number;
  /** How often to refresh while the page is open (0 disables). */
  pollMs?: number;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const otherLabel = viewerRole === "OWNER" ? "Visitor" : "Owner";

  // Light polling: picks up replies without any websocket machinery.
  // Paused while the tab is hidden — background polls are wasted requests.
  useEffect(() => {
    if (!pollMs || closed) return;
    const id = setInterval(() => {
      if (!document.hidden) router.refresh();
    }, pollMs);
    return () => clearInterval(id);
  }, [pollMs, closed, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (sending) return;
    setError(null);
    setSending(true);

    let res: Response;
    try {
      res = await fetch(submitUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
    } catch {
      setSending(false);
      setError(friendlyError("network"));
      return;
    }

    setSending(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(friendlyError(res.status, data?.error));
      return;
    }

    setBody("");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <ol role="log" aria-label="Messages" className="space-y-3">
        {messages.map((m, i) => {
          const mine = m.senderType === viewerRole;
          return (
            <li key={i} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
              {!mine && (i === 0 || messages[i - 1].senderType !== m.senderType) && (
                <span className="meta mb-1 px-1">{otherLabel}</span>
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-[0.9375rem] leading-relaxed",
                  mine
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md border border-border bg-card text-foreground"
                )}
              >
                <p className="whitespace-pre-wrap wrap-break-word">{m.body}</p>
              </div>
              <time dateTime={new Date(m.createdAt).toISOString()} className="meta mt-1 px-1">
                {mine ? "You · " : ""}
                {formatTime(m.createdAt)}
              </time>
            </li>
          );
        })}
      </ol>

      {closed ? (
        <p className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-3 text-center text-sm text-muted-foreground">
          <Lock className="size-4 shrink-0" aria-hidden />
          {closedLabel}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="surface space-y-3 p-3">
          <label htmlFor="replyBody" className="sr-only">
            Write a reply
          </label>
          <Textarea
            id="replyBody"
            rows={2}
            className="min-h-20 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
            placeholder="Write a reply…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={maxChars}
            required
          />
          {error && <FormMessage tone="error">{error}</FormMessage>}
          <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
            <span className="meta">
              {body.length}/{maxChars}
            </span>
            <Button type="submit" disabled={!body.trim()} loading={sending}>
              {!sending && <Send aria-hidden />}
              {sending ? "Sending…" : "Reply"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
