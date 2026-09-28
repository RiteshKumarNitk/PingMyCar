"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteConversationButton({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/conversations/${conversationId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/dashboard/messages");
      router.refresh();
      return;
    }
    const data = await res.json().catch(() => null);
    setError(data?.error ?? "Couldn't delete this conversation. Please try again.");
    setLoading(false);
  }

  if (!confirming) {
    return (
      <Button type="button" variant="ghost" size="sm" className="text-muted-foreground hover:text-danger" onClick={() => setConfirming(true)}>
        <Trash2 aria-hidden />
        Delete this conversation
      </Button>
    );
  }

  return (
    <div className="animate-enter flex flex-wrap items-center gap-3 rounded-xl border border-danger/20 bg-danger-bg/60 px-4 py-3">
      <p className="text-sm text-foreground/80">
        All messages are permanently deleted, and the visitor&apos;s link stops working.
      </p>
      <div className="flex gap-2">
        <Button type="button" variant="destructive" size="sm" disabled={loading} onClick={handleDelete}>
          {loading ? "Deleting…" : "Yes, delete"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
      {error && <p className="w-full text-xs text-destructive">{error}</p>}
    </div>
  );
}
