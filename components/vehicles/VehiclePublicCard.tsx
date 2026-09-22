import type { ReactNode } from "react";
import { Car, MessageCircle } from "lucide-react";
import { visibleReasons, type ContactFlags } from "@/types";
import { VEHICLE_TYPE_LABELS, VEHICLE_TYPES } from "@/lib/validation/vehicle";

export type VehiclePublicCardProps = {
  vehicleName: string | null;
  vehicleType: (typeof VEHICLE_TYPES)[number] | null;
  vehiclePhotoUrl: string | null;
  registrationNumber: string | null;
  ownerDisplayName: string | null;
  ownerPhotoUrl: string | null;
  contactFlags: ContactFlags;
  /**
   * Replaces the static reason list with an interactive one (e.g. the real
   * public page's message composer). Defaults to the read-only preview list,
   * which is what the owner-side contact profile builder uses.
   */
  contactSection?: ReactNode;
};

export function VehiclePublicCard({
  vehicleName,
  vehicleType,
  vehiclePhotoUrl,
  registrationNumber,
  ownerDisplayName,
  ownerPhotoUrl,
  contactFlags,
  contactSection,
}: VehiclePublicCardProps) {
  const reasons = visibleReasons(contactFlags);
  const showsUrgentReason = reasons.some((r) => r.id === "URGENT" || r.id === "SECURITY");

  // When the page header already shows the vehicle identity (and the owner
  // opted out of showing their own), the card carries no media at all.
  const hasIdentity = Boolean(
    vehicleName || vehicleType || vehiclePhotoUrl || registrationNumber || ownerDisplayName
  );

  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm">
      {!hasIdentity ? null : (
      <div className="flex flex-col items-center text-center">
        {vehiclePhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={vehiclePhotoUrl}
            alt={vehicleName ?? "Vehicle"}
            className="h-20 w-20 rounded-xl object-cover"
          />
        ) : (
          <span className="flex h-20 w-20 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Car className="h-9 w-9" aria-hidden />
          </span>
        )}

        {vehicleName && <p className="mt-4 text-lg font-semibold">{vehicleName}</p>}
        {vehicleType && <p className="text-sm text-muted-foreground">{VEHICLE_TYPE_LABELS[vehicleType]}</p>}
        {registrationNumber && (
          <p className="mt-2 rounded-full border border-border px-3 py-1 text-xs font-medium tracking-wide">
            {registrationNumber}
          </p>
        )}

        {ownerDisplayName && (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            {ownerPhotoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ownerPhotoUrl} alt={ownerDisplayName} className="h-6 w-6 rounded-full object-cover" />
            )}
            <span>{ownerDisplayName}</span>
          </div>
        )}
      </div>
      )}

      <div className={!hasIdentity ? "" : "mt-6 border-t border-border pt-5"}>
        {contactSection ? (
          contactSection
        ) : reasons.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            This vehicle isn&apos;t accepting messages right now.
          </p>
        ) : (
          <>
            <p className="text-sm font-medium">Need to contact the owner?</p>
            <div className="mt-3 space-y-2">
              {reasons.map((reason) => (
                <div
                  key={reason.id}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground"
                >
                  <MessageCircle className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  {reason.label}
                </div>
              ))}
            </div>
            {showsUrgentReason && (
              <p className="mt-4 text-center text-xs text-muted-foreground">
                For real emergencies, contact local emergency services.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
