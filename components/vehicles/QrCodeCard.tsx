"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function QrCodeCard({
  vehicleId,
  vehicleName,
  publicUrl,
  svgMarkup,
  qrActive: initialQrActive,
}: {
  vehicleId: string;
  vehicleName: string;
  publicUrl: string;
  svgMarkup: string;
  qrActive: boolean;
}) {
  const router = useRouter();
  const [qrActive, setQrActive] = useState(initialQrActive);
  const [togglePending, setTogglePending] = useState(false);
  const [confirmingRegen, setConfirmingRegen] = useState(false);
  const [regenPending, setRegenPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleActive() {
    const next = !qrActive;
    setTogglePending(true);
    setError(null);
    const res = await fetch(`/api/vehicles/${vehicleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qrActive: next }),
    });
    setTogglePending(false);
    if (!res.ok) {
      setError("Couldn't update the QR status. Try again.");
      return;
    }
    setQrActive(next);
    router.refresh();
  }

  async function regenerate() {
    setRegenPending(true);
    setError(null);
    const res = await fetch(`/api/vehicles/${vehicleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regenerateToken: true }),
    });
    setRegenPending(false);
    setConfirmingRegen(false);
    if (!res.ok) {
      setError("Couldn't regenerate the QR code. Try again.");
      return;
    }
    router.refresh();
  }

  function downloadSvg() {
    const blob = new Blob([svgMarkup], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pingmycar-${vehicleName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.svg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div
          className="aspect-square w-40 shrink-0 rounded-xl border border-border bg-white p-3"
          role="img"
          aria-label="QR code linking to your vehicle's contact page"
          dangerouslySetInnerHTML={{ __html: svgMarkup }}
        />

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-sm font-medium">{qrActive ? "Active" : "Inactive"}</p>
            <p className="text-xs text-muted-foreground">
              {qrActive
                ? "Anyone scanning this QR can contact you."
                : "This QR no longer accepts new messages."}
            </p>
          </div>

          <p className="break-all rounded-md bg-muted px-2 py-1.5 text-xs text-muted-foreground">{publicUrl}</p>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={downloadSvg}>
              Download SVG
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={togglePending} onClick={toggleActive}>
              {togglePending ? "Updating…" : qrActive ? "Deactivate" : "Activate"}
            </Button>
          </div>

          {!confirmingRegen ? (
            <button
              type="button"
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
              onClick={() => setConfirmingRegen(true)}
            >
              Regenerate QR code
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 dark:border-amber-900 dark:bg-amber-950">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                The current sticker will stop working. Print a new one after this.
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="destructive" size="sm" disabled={regenPending} onClick={regenerate}>
                  {regenPending ? "Regenerating…" : "Yes, regenerate"}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmingRegen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
