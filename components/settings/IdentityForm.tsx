"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function IdentityForm({
  initialName,
  initialPreferredName,
  initialPhotoUrl,
}: {
  initialName: string;
  initialPreferredName: string;
  initialPhotoUrl: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [preferredName, setPreferredName] = useState(initialPreferredName);
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    setSaved(false);

    const { error: updateError } = await authClient.updateUser({
      name: name.trim(),
      preferredName: preferredName.trim() || undefined,
      image: photoUrl.trim() || undefined,
    });

    setSaving(false);

    if (updateError) {
      setError(updateError.message ?? "Couldn't save your details. Try again.");
      return;
    }

    // The session cookie is cached for a few minutes — force a fresh fetch so
    // other pages (e.g. the contact profile) don't show stale identity data.
    await authClient.getSession({ query: { disableCookieCache: true } });
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="settingsName">Your name</Label>
        <Input id="settingsName" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="settingsPreferredName">Preferred name (optional)</Label>
        <Input
          id="settingsPreferredName"
          placeholder="e.g. a nickname visitors can use"
          value={preferredName}
          onChange={(e) => setPreferredName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="settingsPhotoUrl">Photo URL (optional)</Label>
        <Input
          id="settingsPhotoUrl"
          placeholder="https://…"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving || !name.trim()}>
          {saving ? "Saving…" : "Save"}
        </Button>
        {saved && <span className="text-sm text-muted-foreground">Saved.</span>}
      </div>
    </form>
  );
}
