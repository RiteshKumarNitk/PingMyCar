"use client";

import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EmailForm({ currentEmail, hasRealEmail }: { currentEmail: string; hasRealEmail: boolean }) {
  const [email, setEmail] = useState(hasRealEmail ? currentEmail : "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    setSaved(false);

    const { error: changeError } = await authClient.changeEmail({ newEmail: email.trim() });

    setSaving(false);

    if (changeError) {
      setError(changeError.message ?? "Couldn't update your email. Try again.");
      return;
    }

    // The session cookie is cached for a few minutes — force a fresh fetch.
    await authClient.getSession({ query: { disableCookieCache: true } });
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {!hasRealEmail && (
        <p className="text-xs text-muted-foreground">
          No email on file yet — add one to get notified when someone messages you.
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="settingsEmail">Email</Label>
        <Input
          id="settingsEmail"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={saving || !email.trim() || email.trim() === currentEmail}>
          {saving ? "Saving…" : "Save"}
        </Button>
        {saved && <span className="text-sm text-muted-foreground">Saved.</span>}
      </div>
    </form>
  );
}
