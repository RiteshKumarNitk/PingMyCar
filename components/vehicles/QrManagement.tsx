"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/shared/ConfirmModal";

/**
 * QR status controls. A regenerate rotates publicToken on the server — we
 * router.refresh() so every server-rendered QR/SVG on the page picks up the
 * new code.
 *
 * Single owner of QR state: the server. The badge/description/buttons render
 * from the `qrActive` prop (server truth via router.refresh()) — never from a
 * mirrored local copy that can drift from the database while a PATCH is in
 * flight. Optimistic UI is limited to button labels and the pending spinner,
 * which resolve when the refreshed render replaces this component's output.
 */
export function QrManagement({ vehicleId, qrActive }: { vehicleId: string; qrActive: boolean }) {
  const router = useRouter();
  const [togglePending, setTogglePending] = useState(false);
  const [confirmingToggle, setConfirmingToggle] = useState(false);
  const [confirmingRegen, setConfirmingRegen] = useState(false);
  const [regenPending, setRegenPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(body: object) {
    const res = await fetch(`/api/vehicles/${vehicleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  }

  async function toggleActive() {
    setTogglePending(true);
    setError(null);
    const ok = await patch({ qrActive: !qrActive });
    setTogglePending(false);
    setConfirmingToggle(false);
    if (!ok) {
      setError("Couldn't update the QR status. Try again.");
      return;
    }
    // No local flip: the refreshed server render carries the new state.
    router.refresh();
  }

  async function regenerate() {
    setRegenPending(true);
    setError(null);
    const ok = await patch({ regenerateToken: true });
    setRegenPending(false);
    setConfirmingRegen(false);
    if (!ok) {
      setError("Couldn't regenerate the QR code. Try again.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Badge variant={qrActive ? "success" : "warning"}>
          <span
            className={`h-1.5 w-1.5 rounded-full ${qrActive ? "bg-success" : "bg-warning"}`}
            aria-hidden
          />
          {qrActive ? "Active" : "Inactive"}
        </Badge>
        <p className="text-sm text-muted-foreground">
          {qrActive
            ? "Anyone scanning this QR can contact you."
            : "This QR no longer accepts new messages."}
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {qrActive ? (
          <Button
            type="button"
            variant="outline"
            disabled={togglePending}
            onClick={() => setConfirmingToggle(true)}
          >
            {togglePending ? "Deactivating…" : "Deactivate QR"}
          </Button>
        ) : (
          <Button type="button" disabled={togglePending} onClick={toggleActive}>
            {togglePending ? "Activating…" : "Activate QR"}
          </Button>
        )}
        <Button type="button" variant="outline" onClick={() => setConfirmingRegen(true)}>
          Regenerate QR
        </Button>
      </div>

      <ConfirmModal
        open={confirmingToggle}
        title="Deactivate this QR?"
        description="New conversations will be stopped immediately — anyone scanning the sticker will see that it's inactive. You can reactivate it at any time."
        confirmLabel="Deactivate"
        pendingLabel="Deactivating…"
        busy={togglePending}
        onConfirm={toggleActive}
        onClose={() => setConfirmingToggle(false)}
      />

      <ConfirmModal
        open={confirmingRegen}
        title="Regenerate this QR?"
        description="Regenerating this QR will invalidate the previous QR code. Stickers already printed will stop working — print a new one after this."
        confirmLabel="Regenerate"
        pendingLabel="Regenerating…"
        busy={regenPending}
        onConfirm={regenerate}
        onClose={() => setConfirmingRegen(false)}
      />
    </div>
  );
}
