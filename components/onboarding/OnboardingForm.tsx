"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OnboardingForm({
  needsName,
  needsVehicle,
}: {
  needsName: boolean;
  needsVehicle: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [vehicleName, setVehicleName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSubmit = (!needsName || name.trim()) && (!needsVehicle || vehicleName.trim());

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    if (needsName) {
      const { error: nameError } = await authClient.updateUser({ name: name.trim() });
      if (nameError) {
        setSaving(false);
        setError(nameError.message ?? "Couldn't save your name. Try again.");
        return;
      }
    }

    if (needsVehicle) {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: vehicleName.trim() }),
      });
      if (!res.ok) {
        setSaving(false);
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't add your vehicle. Try again.");
        return;
      }
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {needsName && (
        <div className="space-y-2">
          <Label htmlFor="name">Your name</Label>
          <Input
            id="name"
            placeholder="Alex Owner"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>
      )}

      {needsVehicle && (
        <div className="space-y-2">
          <Label htmlFor="vehicleName">Vehicle name</Label>
          <Input
            id="vehicleName"
            placeholder="Honda City"
            value={vehicleName}
            onChange={(e) => setVehicleName(e.target.value)}
            required
            autoFocus={!needsName}
          />
          <p className="text-xs text-muted-foreground">
            You can add type, registration, and more once you&apos;re in.
          </p>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={saving || !canSubmit}>
        {saving ? "Saving…" : "Continue"}
      </Button>
    </form>
  );
}
