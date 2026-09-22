"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VEHICLE_TYPES, VEHICLE_TYPE_LABELS } from "@/lib/validation/vehicle";

type VehicleFormValues = {
  name: string;
  type: string;
  registrationNumber: string;
  color?: string;
  photoUrl?: string;
};

export function VehicleForm({
  mode,
  vehicleId,
  initialValues,
}: {
  mode: "create" | "edit";
  vehicleId?: string;
  initialValues?: VehicleFormValues;
}) {
  const router = useRouter();
  const [values, setValues] = useState<VehicleFormValues>(
    initialValues ?? { name: "", type: "", registrationNumber: "", color: "", photoUrl: "" }
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url = mode === "create" ? "/api/vehicles" : `/api/vehicles/${vehicleId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        type: values.type || undefined,
        registrationNumber: values.registrationNumber || undefined,
        color: values.color?.trim() || undefined,
        photoUrl: values.photoUrl?.trim() || undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Something went wrong. Try again.");
      return;
    }

    const { vehicle } = await res.json();
    if (mode === "create") {
      router.push(`/onboarding/ready?vehicle=${vehicle.id}`);
    } else {
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Vehicle nickname</Label>
        <Input
          id="name"
          placeholder="My Car"
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          required
          autoFocus
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="type">Vehicle type</Label>
          <select
            id="type"
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
            value={values.type}
            onChange={(e) => setValues((v) => ({ ...v, type: e.target.value }))}
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
            value={values.registrationNumber}
            onChange={(e) => setValues((v) => ({ ...v, registrationNumber: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="color">
          Vehicle color <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="color"
          placeholder="White"
          value={values.color ?? ""}
          onChange={(e) => setValues((v) => ({ ...v, color: e.target.value }))}
        />
        <p className="text-xs text-muted-foreground">
          Helps visitors confirm they&apos;ve got the right vehicle — shown publicly only if you enable it.
        </p>
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">
        Private by default — hidden from visitors unless you choose to show it on the
        vehicle&apos;s contact profile.
      </p>

      <div className="space-y-2">
        <Label htmlFor="photoUrl">
          Photo URL <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="photoUrl"
          placeholder="https://…"
          value={values.photoUrl ?? ""}
          onChange={(e) => setValues((v) => ({ ...v, photoUrl: e.target.value }))}
        />
        <p className="text-xs text-muted-foreground">
          Shown on your public page if you enable it in the contact profile.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading || !values.name.trim()}>
        {loading ? "Saving…" : mode === "create" ? "Generate My Free QR" : "Save changes"}
      </Button>
    </form>
  );
}
