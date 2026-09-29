"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, Lock, Send } from "lucide-react";
import { visibleReasons, type ContactFlags, type ContactReasonId } from "@/types";
import { REASON_ICONS } from "@/components/public/reasonIcons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormMessage } from "@/components/ui/field";
import { friendlyError } from "@/lib/ui/errors";
import { cn } from "@/lib/utils";

export function StartConversationForm({
  publicToken,
  contactFlags,
  maxChars,
  demo = false,
}: {
  publicToken: string;
  contactFlags: ContactFlags;
  maxChars: number;
  /** Demo QR: the send is simulated here — nothing is posted, no owner is notified. */
  demo?: boolean;
}) {
  const router = useRouter();
  const reasons = visibleReasons(contactFlags);
  const [selectedReason, setSelectedReason] = useState<ContactReasonId | null>(null);
  const [messageBody, setMessageBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [demoSent, setDemoSent] = useState(false);

  if (demoSent) {
    return (
      <div role="status" className="space-y-3 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-success-bg text-success">
          <Check className="size-6" aria-hidden />
        </span>
        <p className="section-title">Demo message ready</p>
        <p className="supporting">
          This was a demo, so nothing was sent. With a real OwnerPing QR, the owner gets a private
          notification and can reply here — without either of you sharing a phone number.
        </p>
        <Button type="button" variant="outline" onClick={() => { setDemoSent(false); setSelectedReason(null); setMessageBody(""); }}>
          Try again
        </Button>
      </div>
    );
  }

  if (reasons.length === 0) {
    return (
      <p className="supporting text-center">This vehicle isn&apos;t accepting messages right now.</p>
    );
  }

  const needsBody = selectedReason === "OTHER";
  const canSend = Boolean(selectedReason) && (!needsBody || Boolean(messageBody.trim()));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedReason || sending) return;
    if (demo) {
      setDemoSent(true);
      return;
    }
    setError(null);
    setSending(true);

    let res: Response;
    try {
      res = await fetch("/api/public/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicToken, reason: selectedReason, body: messageBody }),
      });
    } catch {
      setSending(false);
      setError(friendlyError("network"));
      return;
    }

    if (!res.ok) {
      setSending(false);
      const data = await res.json().catch(() => null);
      setError(friendlyError(res.status, data?.error));
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <fieldset>
        <legend className="section-title">Why are you contacting the owner?</legend>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {reasons.map((reason, i) => {
            const Icon = REASON_ICONS[reason.id];
            const selected = selectedReason === reason.id;
            const spanFull = reasons.length % 2 === 1 && i === reasons.length - 1;
            return (
              <button
                key={reason.id}
                type="button"
                onClick={() => setSelectedReason(reason.id)}
                aria-pressed={selected}
                className={cn(
                  "relative flex min-h-19 flex-col items-start justify-between gap-2 rounded-xl border p-3.5 text-left text-sm font-medium leading-snug transition-[border-color,background-color,box-shadow] duration-150",
                  spanFull && "col-span-2 min-h-14 flex-row items-center justify-start",
                  selected
                    ? "border-primary bg-primary-soft text-foreground ring-2 ring-primary/20"
                    : "border-border bg-card text-foreground/85 hover:border-primary/40"
                )}
              >
                <Icon className={cn("size-5 shrink-0", selected ? "text-primary" : "text-muted-foreground")} strokeWidth={1.75} aria-hidden />
                {reason.label}
                {selected && (
                  <span className="absolute right-2.5 top-2.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3" strokeWidth={3} aria-hidden />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </fieldset>

      {selectedReason && (
        <div className="animate-enter space-y-2">
          <div className="flex items-baseline justify-between">
            <label htmlFor="visitorMessage" className="text-sm font-medium">
              {needsBody ? "Your message" : "Add a note"}
              {!needsBody && <span className="font-normal text-muted-foreground"> (optional)</span>}
            </label>
            <span className="meta" aria-live="polite">
              {messageBody.length}/{maxChars}
            </span>
          </div>
          <Textarea
            id="visitorMessage"
            rows={3}
            placeholder={needsBody ? "Tell the owner what's going on…" : "e.g. Parked at gate 2, blocking the exit"}
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            maxLength={maxChars}
            required={needsBody}
            autoFocus
          />
        </div>
      )}

      {error && <FormMessage tone="error">{error}</FormMessage>}

      <div className="space-y-3">
        <Button type="submit" size="lg" className="h-14 w-full text-base" disabled={!canSend} loading={sending}>
          {!sending && <Send aria-hidden />}
          {sending ? "Sending…" : "Send Message"}
        </Button>
        {!selectedReason && <p className="meta text-center">Choose a reason above to continue.</p>}
        <p className="flex items-center justify-center gap-1.5 text-center text-sm text-muted-foreground">
          <Lock className="size-3.5 shrink-0" aria-hidden />
          You don&apos;t need to share your phone number or email.
        </p>
      </div>

    </form>
  );
}
