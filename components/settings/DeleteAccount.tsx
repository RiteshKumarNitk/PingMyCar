"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Web account deletion. Two explicit steps (checkbox, then a confirm
 * button); calls DELETE /api/account, which works on the session only. The
 * owner is signed out only after the server confirms.
 */
export function DeleteAccount() {
  const [understood, setUnderstood] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "We couldn't delete your account. Please try again.");
        return;
      }
      window.location.assign("/?account=deleted");
    } catch {
      setError("You're offline. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 text-sm">
      <p className="text-muted-foreground">
        Permanently deletes your account, vehicles and their QR codes (printed stickers stop
        working), photos, conversations and messages, and your devices&apos; notification
        tokens. This can&apos;t be undone.
      </p>
      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4"
          checked={understood}
          onChange={(e) => {
            setUnderstood(e.target.checked);
            setConfirming(false);
          }}
        />
        <span>I understand my account and data will be permanently deleted.</span>
      </label>
      {error && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive">
          {error}
        </p>
      )}
      {!confirming ? (
        <Button variant="destructive" disabled={!understood} onClick={() => setConfirming(true)}>
          Delete account
        </Button>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">Delete your OwnerPing account now?</span>
          <Button variant="outline" disabled={busy} onClick={() => setConfirming(false)}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={busy} onClick={remove}>
            {busy ? "Deleting…" : "Yes, delete permanently"}
          </Button>
        </div>
      )}
    </div>
  );
}
