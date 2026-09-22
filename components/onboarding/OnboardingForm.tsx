"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VEHICLE_TYPES, VEHICLE_TYPE_LABELS } from "@/lib/validation/vehicle";

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
  const [vehicleType, setVehicleType] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
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
        body: JSON.stringify({
          name: vehicleName.trim(),
          type: vehicleType || undefined,
          registrationNumber: registrationNumber.trim() || undefined,
        }),
      });
      if (!res.ok) {
        setSaving(false);
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't add your vehicle. Try again.");
        return;
      }
      const { vehicle } = await res.json();
      router.push(`/onboarding/ready?vehicle=${vehicle.id}`);
      router.refresh();
      return;
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
        <>
          <div className="space-y-2">
            <Label htmlFor="vehicleName">Vehicle nickname</Label>
            <Input
              id="vehicleName"
              placeholder="My Car"
              value={vehicleName}
              onChange={(e) => setVehicleName(e.target.value)}
              required
              autoFocus={!needsName}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vehicleType">Vehicle type</Label>
              <select
                id="vehicleType"
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
              >
                <option value="">Not specified</option>
                {VEHICLE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {VEHICLE_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationNumber">
                Registration number{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="registrationNumber"
                placeholder="RJ14XX0000"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Only what&apos;s needed — your registration number stays private unless you
            choose to show it. You can add a photo and more later.
          </p>
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={saving || !canSubmit}>
        {saving ? "Setting up…" : "Generate My Free QR"}
      </Button>
    </form>
  );
}
