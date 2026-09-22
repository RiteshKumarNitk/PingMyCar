"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { MessageThread } from "@/components/messages/MessageThread";
import { ReportConversationLink } from "@/components/public/ReportConversationLink";

type ConversationData = {
  vehicleName: string;
  status: string;
  messages: { senderType: "VISITOR" | "OWNER"; body: string; createdAt: string }[];
};

/**
 * The visitor's private conversation. Client component so it can poll GET
 * /api/public/conversations/<token> for the owner's replies without any
 * websocket machinery.
 */
export function VisitorConversation({ visitorToken }: { visitorToken: string }) {
  const [data, setData] = useState<ConversationData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // One-shot success state, set by the contact form right before navigating here.
  const [justSent, setJustSent] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("pmc-just-sent") === visitorToken) {
        setJustSent(true);
        sessionStorage.removeItem("pmc-just-sent");
      }
    } catch {
      // storage unavailable — skip the banner
    }
  }, [visitorToken]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/public/conversations/${visitorToken}`);
        if (cancelled) return;
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) {
          setError("Couldn't load the conversation. Check your link and refresh.");
          return;
        }
        setData(await res.json());
        setError(null);
      } catch {
        if (!cancelled) setError("Couldn't load the conversation. Check your connection.");
      }
    }

    load();
    const id = setInterval(load, 10000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [visitorToken]);

  if (notFound) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
        <Logo />
        <div className="mt-10 w-full max-w-sm rounded-2xl border border-border bg-card p-8">
          <p className="font-semibold">Conversation not found.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            This link may be wrong, or the conversation may have been removed.
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <span
            className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
            aria-hidden
          />
          <p className="text-sm">Loading your conversation…</p>
        </div>
      </div>
    );
  }

  const closed = data.status !== "OPEN";
  // Server enforces the real limit; this is a soft client-side cap.
  const maxChars = 500;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-md items-center justify-center px-4">
          <Logo />
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {data.vehicleName}
        </p>
        <h1 className="mt-1 text-xl font-bold tracking-tight">Your conversation</h1>

        {justSent && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-success/30 bg-success-bg px-4 py-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-success">Message sent</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                The vehicle owner has been notified. Your message was delivered through
                PingMyCar — your personal contact information was not shared.
              </p>
            </div>
          </div>
        )}

        <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          🔒 Bookmark this link — it&apos;s the only way back to this conversation.
        </p>

        <div className="mt-6">
          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
          <MessageThread
            submitUrl={`/api/public/conversations/${visitorToken}`}
            viewerRole="VISITOR"
            messages={data.messages}
            closed={closed}
            maxChars={maxChars}
          />
        </div>

        <div className="mt-8">
          <ReportConversationLink visitorToken={visitorToken} />
        </div>
      </main>
    </div>
  );
}
