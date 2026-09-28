"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/**
 * Owner toggle for conversation retention: kept conversations are exempt
 * from the automatic delete; unkept ones show when they'll be removed.
 */
export function KeepConversationButton({
  conversationId,
  kept,
  autoDeleteLabel,
}: {
  conversationId: string;
  kept: boolean;
  /** Pre-formatted auto-delete date (server-rendered); null when kept. */
  autoDeleteLabel: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/conversations/${conversationId}/keep`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keep: !kept }),
    });
    setLoading(false);
    if (res.ok) router.refresh();
    else setError("Couldn't update. Please try again.");
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-muted px-3 py-2">
      <p className="text-xs text-muted-foreground">
        {kept
          ? "Kept — this conversation won't be deleted automatically."
          : `Auto-deletes ${autoDeleteLabel ?? "soon"} (5 days after the last message).`}
      </p>
      <Button type="button" variant={kept ? "ghost" : "outline"} size="sm" disabled={loading} onClick={toggle}>
        {loading ? "Saving…" : kept ? "Don't keep" : "Keep conversation"}
      </Button>
      {error && <p className="w-full text-xs text-destructive">{error}</p>}
    </div>
  );
}
