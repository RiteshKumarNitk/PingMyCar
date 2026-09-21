"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { visibleReasons, type ContactFlags, type ContactReasonId } from "@/types";
import { Button } from "@/components/ui/button";

export function StartConversationForm({
  publicToken,
  contactFlags,
  maxChars,
}: {
  publicToken: string;
  contactFlags: ContactFlags;
  maxChars: number;
}) {
  const router = useRouter();
  const reasons = visibleReasons(contactFlags);
  const [selectedReason, setSelectedReason] = useState<ContactReasonId | null>(null);
  const [messageBody, setMessageBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  if (reasons.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        This vehicle isn&apos;t accepting messages right now.
      </p>
    );
  }

  const showsUrgentReason = reasons.some((r) => r.id === "URGENT" || r.id === "SECURITY");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedReason) return;
    setError(null);
    setSending(true);

    const res = await fetch("/api/public/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicToken, reason: selectedReason, body: messageBody }),
    });

    setSending(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Couldn't send your message. Try again.");
      return;
    }

    const { visitorToken } = await res.json();
    router.push(`/c/${visitorToken}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-sm font-medium">Need to contact the owner?</p>
        <div className="mt-3 grid gap-2">
          {reasons.map((reason) => (
            <button
              key={reason.id}
              type="button"
              onClick={() => setSelectedReason(reason.id)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                selectedReason === reason.id
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              <MessageCircle className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              {reason.label}
            </button>
          ))}
        </div>
      </div>

      {selectedReason && (
        <textarea
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
          rows={4}
          placeholder="Add a message"
          value={messageBody}
          onChange={(e) => setMessageBody(e.target.value)}
          maxLength={maxChars}
          required
          autoFocus
        />
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {selectedReason && (
        <Button type="submit" className="w-full" disabled={sending || !messageBody.trim()}>
          {sending ? "Sending…" : "Send message"}
        </Button>
      )}

      {showsUrgentReason && (
        <p className="text-center text-xs text-muted-foreground">
          For real emergencies, contact local emergency services.
        </p>
      )}
    </form>
  );
}
