"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function BlockConversationButton({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleBlock() {
    setLoading(true);
    const res = await fetch(`/api/conversations/${conversationId}/block`, { method: "POST" });
    setLoading(false);
    if (res.ok) {
      router.refresh();
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        onClick={() => setConfirming(true)}
      >
        Block this conversation
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-muted px-3 py-2">
      <p className="text-xs text-muted-foreground">Neither of you will be able to send messages after this.</p>
      <div className="flex gap-2">
        <Button type="button" variant="destructive" size="sm" disabled={loading} onClick={handleBlock}>
          {loading ? "Blocking…" : "Yes, block"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
