import type { ReactNode } from "react";
import { Car, ShieldCheck } from "lucide-react";
import { visibleReasons, type ContactFlags } from "@/types";
import { VEHICLE_TYPE_LABELS, VEHICLE_TYPES } from "@/lib/validation/vehicle";
import { REASON_ICONS } from "@/components/public/reasonIcons";

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

/** What a visitor sees about a vehicle — only fields the owner chose to show. */
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

  const hasIdentity = Boolean(
    vehicleName || vehicleType || vehiclePhotoUrl || registrationNumber || ownerDisplayName
  );

  return (
    <div className="surface mx-auto w-full max-w-md overflow-hidden rounded-2xl shadow-raised">
      {hasIdentity && (
        <div className="flex items-center gap-4 border-b border-border p-5">
          {vehiclePhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={vehiclePhotoUrl} alt={vehicleName ?? "Vehicle"} className="size-16 shrink-0 rounded-xl object-cover" />
          ) : (
            <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Car className="size-8" strokeWidth={1.5} aria-hidden />
            </span>
          )}
          <div className="min-w-0 flex-1">
            {vehicleName && <p className="truncate text-lg font-semibold tracking-tight">{vehicleName}</p>}
            {vehicleType && <p className="text-sm text-muted-foreground">{VEHICLE_TYPE_LABELS[vehicleType]}</p>}
            {registrationNumber && (
              <p className="mt-2 inline-flex rounded-md border border-foreground/15 bg-surface-2 px-2 py-0.5 font-mono text-xs font-semibold uppercase tracking-[0.12em]">
                {registrationNumber}
              </p>
            )}
            {ownerDisplayName && (
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                {ownerPhotoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ownerPhotoUrl} alt="" className="size-5 rounded-full object-cover" />
                )}
                <span className="truncate">Owner: {ownerDisplayName}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="p-5">
        {contactSection ? (
          contactSection
        ) : reasons.length === 0 ? (
          <p className="supporting text-center">This vehicle isn&apos;t accepting messages right now.</p>
        ) : (
          <>
            <p className="section-title">Why are you contacting the owner?</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {reasons.map((reason) => {
                const Icon = REASON_ICONS[reason.id];
                return (
                  <div
                    key={reason.id}
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm text-foreground/80"
                  >
                    <Icon className="size-4 shrink-0 text-primary" strokeWidth={1.75} aria-hidden />
                    <span className="min-w-0 leading-snug">{reason.label}</span>
                  </div>
                );
              })}
            </div>
            <p className="meta mt-4 flex items-center justify-center gap-1.5">
              <ShieldCheck className="size-3.5 text-success" aria-hidden />
              No phone number or email is shared.
            </p>
            {showsUrgentReason && (
              <p className="meta mt-1 text-center">For real emergencies, contact local emergency services.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
