"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban } from "lucide-react";
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
      <Button type="button" variant="ghost" size="sm" className="text-muted-foreground hover:text-danger" onClick={() => setConfirming(true)}>
        <Ban aria-hidden />
        Block this conversation
      </Button>
    );
  }

  return (
    <div className="animate-enter flex flex-wrap items-center gap-3 rounded-xl border border-danger/20 bg-danger-bg/60 px-4 py-3">
      <p className="text-sm text-foreground/80">Neither of you will be able to send messages after this.</p>
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
