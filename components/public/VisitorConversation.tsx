"use client";

import { useEffect, useState } from "react";
import { Bookmark, CheckCircle2, Lock } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/badge";
import { MessageThread } from "@/components/messages/MessageThread";
import { ReportConversationLink } from "@/components/public/ReportConversationLink";

type ConversationData = {
  vehicleName: string | null;
  status: string;
  messages: { senderType: "VISITOR" | "OWNER"; body: string; createdAt: string }[];
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="bg-navy">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <Logo linked={false} inverse />
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white/70">
            <Lock className="size-3" aria-hidden />
            Private conversation
          </span>
        </div>
      </header>
      {children}
    </div>
  );
}

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
          setError("Couldn't load new messages. We'll keep trying.");
          return;
        }
        setData(await res.json());
        setError(null);
      } catch {
        if (!cancelled) setError("You appear to be offline. We'll reconnect automatically.");
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
      <Shell>
        <ErrorState
          kind={404}
          title="Conversation not found"
          description="This link may be wrong, or the conversation may have been removed."
        />
      </Shell>
    );
  }

  if (!data) {
    return (
      <Shell>
        <main className="mx-auto w-full max-w-md space-y-4 px-4 py-6" aria-busy="true" aria-label="Loading your conversation">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-7 w-52" />
          <Skeleton className="ml-auto h-16 w-3/4 rounded-2xl" />
          <Skeleton className="h-12 w-2/3 rounded-2xl" />
        </main>
      </Shell>
    );
  }

  const closed = data.status !== "OPEN";
  // Server enforces the real limit; this is a soft client-side cap.
  const maxChars = 500;

  return (
    <Shell>
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow truncate">{data.vehicleName ?? "Private message"}</p>
            <h1 className="page-title mt-1">Your conversation</h1>
          </div>
          <StatusBadge
            status={data.status === "BLOCKED" ? "blocked" : closed ? "closed" : "open"}
            className="mt-1"
          />
        </div>

        {justSent && (
          <div role="status" className="animate-enter mt-5 flex items-start gap-3 rounded-xl bg-success-bg px-4 py-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-success">Message sent</p>
              <p className="mt-0.5 text-sm text-foreground/75">
                The owner has been notified. Your personal contact details were not shared.
              </p>
            </div>
          </div>
        )}

        <p className="mt-4 flex items-start gap-2 rounded-lg bg-surface-2 px-3 py-2.5 text-sm text-muted-foreground">
          <Bookmark className="mt-0.5 size-4 shrink-0" aria-hidden />
          Bookmark this page — this link is the only way back to your conversation.
        </p>

        <div className="mt-6">
          {error && (
            <p role="status" className="meta mb-4 text-center">
              {error}
            </p>
          )}
          <MessageThread
            submitUrl={`/api/public/conversations/${visitorToken}`}
            viewerRole="VISITOR"
            messages={data.messages}
            closed={closed}
            maxChars={maxChars}
          />
        </div>

        <div className="mt-10">
          <ReportConversationLink visitorToken={visitorToken} />
        </div>
      </main>
    </Shell>
  );
}
