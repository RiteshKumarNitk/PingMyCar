"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VehiclePublicCard } from "@/components/vehicles/VehiclePublicCard";
import type { VEHICLE_TYPES } from "@/lib/validation/vehicle";

type ToggleKey =
  | "showVehicleName"
  | "showVehicleType"
  | "showVehiclePhoto"
  | "showRegistrationNumber"
  | "showOwnerName"
  | "showOwnerPhoto"
  | "showPreferredName"
  | "allowMessages"
  | "allowParkingAlerts"
  | "allowVehicleIssues"
  | "allowDamageReports"
  | "allowEmergencyAlerts";

type Toggles = Record<ToggleKey, boolean>;

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
  disabled,
  disabledReason,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  disabledReason?: string;
}) {
  return (
    <label className="flex items-start justify-between gap-4 py-2.5">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
        {disabled && disabledReason && (
          <span className="mt-0.5 block text-xs text-amber-600 dark:text-amber-500">{disabledReason}</span>
        )}
      </span>
      <input
        type="checkbox"
        className="mt-1 h-4 w-9 shrink-0 cursor-pointer appearance-none rounded-full bg-input transition-colors checked:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(circle 6px at 8px 8px, white 100%, transparent 100%)",
          backgroundPosition: checked ? "16px 0" : "0 0",
          backgroundRepeat: "no-repeat",
        }}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-b border-border py-5 first:pt-0 last:border-b-0">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      <div className="mt-1 divide-y divide-border/60">{children}</div>
    </div>
  );
}

export function VehicleProfileForm({
  vehicle,
  toggles: initialToggles,
  owner,
}: {
  vehicle: {
    id: string;
    name: string;
    type: (typeof VEHICLE_TYPES)[number] | null;
    photoUrl: string | null;
    registrationNumber: string | null;
  };
  toggles: Toggles;
  owner: {
    name: string;
    preferredName: string | null;
    image: string | null;
    phoneNumber: string | null;
  };
}) {
  const router = useRouter();
  const [toggles, setToggles] = useState<Toggles>(initialToggles);
  const [displayName, setDisplayName] = useState(owner.name === owner.phoneNumber ? "" : owner.name);
  const [preferredName, setPreferredName] = useState(owner.preferredName ?? "");
  const [photoUrl, setPhotoUrl] = useState(owner.image ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (key: ToggleKey) => (checked: boolean) => {
    setToggles((t) => ({ ...t, [key]: checked }));
    setSaved(false);
  };

  const nameNotSet = !displayName.trim();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const profileRes = await fetch(`/api/vehicles/${vehicle.id}/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toggles),
    });

    if (!profileRes.ok) {
      setSaving(false);
      const data = await profileRes.json().catch(() => null);
      setError(data?.error ?? "Couldn't save your contact profile. Try again.");
      return;
    }

    const { error: identityError } = await authClient.updateUser({
      name: displayName.trim() || owner.phoneNumber || owner.name,
      preferredName: preferredName.trim() || undefined,
      image: photoUrl.trim() || undefined,
    });

    setSaving(false);

    if (identityError) {
      setError(identityError.message ?? "Couldn't save your details. Try again.");
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <form onSubmit={handleSubmit}>
        <Section title="Vehicle">
          <ToggleRow label="Vehicle name" checked={toggles.showVehicleName} onChange={set("showVehicleName")} />
          <ToggleRow label="Vehicle type" checked={toggles.showVehicleType} onChange={set("showVehicleType")} />
          <ToggleRow label="Vehicle photo" checked={toggles.showVehiclePhoto} onChange={set("showVehiclePhoto")} />
          <ToggleRow
            label="Registration number"
            hint="Hidden by default. Only turn this on if you're comfortable with visitors seeing it."
            checked={toggles.showRegistrationNumber}
            onChange={set("showRegistrationNumber")}
          />
        </Section>

        <Section title="Your identity">
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="displayName">Your name</Label>
              <Input
                id="displayName"
                placeholder="Add your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredName">Preferred name (optional)</Label>
              <Input
                id="preferredName"
                placeholder="e.g. a nickname visitors can use"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerPhotoUrl">Photo URL (optional)</Label>
              <Input
                id="ownerPhotoUrl"
                placeholder="https://…"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
              />
            </div>
          </div>
          <ToggleRow
            label="Show your name"
            checked={toggles.showOwnerName}
            onChange={set("showOwnerName")}
            disabled={nameNotSet}
            disabledReason={nameNotSet ? "Add your name above first." : undefined}
          />
          <ToggleRow
            label="Show your preferred name instead"
            checked={toggles.showPreferredName}
            onChange={set("showPreferredName")}
            disabled={!preferredName.trim()}
            disabledReason={!preferredName.trim() ? "Add a preferred name above first." : undefined}
          />
          <ToggleRow label="Show your photo" checked={toggles.showOwnerPhoto} onChange={set("showOwnerPhoto")} />
        </Section>

        <Section title="How people can contact you">
          <ToggleRow
            label="Allow messages"
            hint="Master switch — turn off to stop new conversations entirely."
            checked={toggles.allowMessages}
            onChange={set("allowMessages")}
          />
          <ToggleRow
            label="Parking alerts"
            hint="Lights on, blocking an exit, door left open"
            checked={toggles.allowParkingAlerts}
            onChange={set("allowParkingAlerts")}
          />
          <ToggleRow label="Vehicle issues" checked={toggles.allowVehicleIssues} onChange={set("allowVehicleIssues")} />
          <ToggleRow label="Damage reports" checked={toggles.allowDamageReports} onChange={set("allowDamageReports")} />
          <ToggleRow
            label="Urgent / security alerts"
            hint="Visitors are still told to contact local emergency services for real emergencies."
            checked={toggles.allowEmergencyAlerts}
            onChange={set("allowEmergencyAlerts")}
          />
          <ToggleRow label="Call request" checked={false} onChange={() => {}} disabled disabledReason="Coming soon" />
          <ToggleRow label="WhatsApp" checked={false} onChange={() => {}} disabled disabledReason="Coming soon" />
        </Section>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        <div className="mt-6 flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
          {saved && <span className="text-sm text-muted-foreground">Saved.</span>}
        </div>
      </form>

      <div className="lg:sticky lg:top-10 lg:self-start">
        <p className="mb-3 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
          What visitors see
        </p>
        <VehiclePublicCard
          vehicleName={toggles.showVehicleName ? vehicle.name : null}
          vehicleType={toggles.showVehicleType ? vehicle.type : null}
          vehiclePhotoUrl={toggles.showVehiclePhoto ? vehicle.photoUrl : null}
          registrationNumber={toggles.showRegistrationNumber ? vehicle.registrationNumber : null}
          ownerDisplayName={
            toggles.showPreferredName && preferredName.trim()
              ? preferredName.trim()
              : toggles.showOwnerName && displayName.trim()
                ? displayName.trim()
                : null
          }
          ownerPhotoUrl={toggles.showOwnerPhoto ? photoUrl.trim() || null : null}
          contactFlags={{
            allowMessages: toggles.allowMessages,
            allowParkingAlerts: toggles.allowParkingAlerts,
            allowVehicleIssues: toggles.allowVehicleIssues,
            allowDamageReports: toggles.allowDamageReports,
            allowEmergencyAlerts: toggles.allowEmergencyAlerts,
          }}
        />
      </div>
    </div>
  );
}
