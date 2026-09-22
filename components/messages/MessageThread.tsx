"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Message = { senderType: "VISITOR" | "OWNER"; body: string; createdAt: string | Date };

export function MessageThread({
  submitUrl,
  messages,
  viewerRole,
  closed,
  closedLabel = "This conversation has ended.",
  maxChars,
}: {
  /** Where a new reply is POSTed — the public visitor route or the owner route. */
  submitUrl: string;
  messages: Message[];
  /** Which senderType renders as "my own message" (right-aligned, primary color). */
  viewerRole: "VISITOR" | "OWNER";
  closed: boolean;
  closedLabel?: string;
  maxChars: number;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);

    const res = await fetch(submitUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });

    setSending(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Couldn't send your reply. Try again.");
      return;
    }

    setBody("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.senderType === viewerRole ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                m.senderType === viewerRole
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card"
              }`}
            >
              {m.body}
            </div>
          </div>
        ))}
      </div>

      {closed ? (
        <p className="text-center text-sm text-muted-foreground">{closedLabel}</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
            rows={3}
            placeholder="Write a reply"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={maxChars}
            required
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={sending || !body.trim()}>
            {sending ? "Sending…" : "Reply"}
          </Button>
        </form>
      )}
    </div>
  );
}
