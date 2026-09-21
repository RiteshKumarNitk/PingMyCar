"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function DeleteVehicleButton({ vehicleId }: { vehicleId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const res = await fetch(`/api/vehicles/${vehicleId}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) {
      router.push("/dashboard/vehicles");
      router.refresh();
    }
  }

  if (!confirming) {
    return (
      <Button variant="destructive" size="sm" onClick={() => setConfirming(true)}>
        Delete vehicle
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <p className="text-sm text-muted-foreground">Are you sure?</p>
      <Button variant="destructive" size="sm" disabled={loading} onClick={handleDelete}>
        {loading ? "Deleting…" : "Yes, delete"}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </div>
  );
}
