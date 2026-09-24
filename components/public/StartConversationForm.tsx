"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Lock, Send } from "lucide-react";
import { visibleReasons, type ContactFlags, type ContactReasonId } from "@/types";
import { REASON_ICONS } from "@/components/public/reasonIcons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
    // One-shot flag: the conversation page shows the "message sent" success
    // state exactly once, right after this navigation.
    try {
      sessionStorage.setItem("pmc-just-sent", visitorToken);
    } catch {
      // storage unavailable — the banner is cosmetic, don't block the send
    }
    router.push(`/c/${visitorToken}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-sm font-medium">How can we help?</p>
        <div className="mt-3 grid gap-2">
          {reasons.map((reason) => {
            const Icon = REASON_ICONS[reason.id];
            return (
              <button
                key={reason.id}
                type="button"
                onClick={() => setSelectedReason(reason.id)}
                aria-pressed={selectedReason === reason.id}
                className={`flex min-h-14 items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-base transition-colors ${
                  selectedReason === reason.id
                    ? "border-primary bg-primary/5 font-medium text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                {reason.label}
              </button>
            );
          })}
        </div>
      </div>

      {selectedReason && (
        <div className="space-y-1.5">
          <label htmlFor="visitorMessage" className="text-sm font-medium">
            {selectedReason === "OTHER" ? "Your message" : "Add a note (optional)"}
          </label>
          <Textarea
            id="visitorMessage"
            rows={3}
            className="min-h-24 text-base"
            placeholder={
              selectedReason === "OTHER"
                ? "Tell the owner what's going on…"
                : "Anything else they should know? (optional)"
            }
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            maxLength={maxChars}
            required={selectedReason === "OTHER"}
            autoFocus
          />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {selectedReason && (
        <Button type="submit" size="lg" className="h-14 w-full text-base" disabled={sending || (selectedReason === "OTHER" && !messageBody.trim())}>
          <Send className="h-4 w-4" aria-hidden />
          {sending ? "Sending…" : "Send Message"}
        </Button>
      )}

      {showsUrgentReason && (
        <p className="text-center text-sm text-muted-foreground">
          For a real emergency, call local emergency services — not this page.
        </p>
      )}
    </form>
  );
}
