import type { VEHICLE_TYPES } from "@/lib/validation/vehicle";

export const CONTACT_REASONS = [
  { id: "LIGHTS_ON", label: "Lights are on" },
  { id: "MOVE_VEHICLE", label: "Please move the vehicle" },
  { id: "DOOR_OPEN", label: "Door/window appears open" },
  { id: "VEHICLE_ISSUE", label: "Vehicle issue" },
  { id: "DAMAGE", label: "Possible damage" },
  { id: "SECURITY", label: "Security concern" },
  { id: "URGENT", label: "Urgent" },
  { id: "OTHER", label: "Other" },
] as const;

/**
 * Human label for a reason id; falls back to the raw id for unknown values.
 * Single owner for every dashboard/inbox rendering of a conversation reason.
 */
export function reasonLabel(id: string): string {
  return CONTACT_REASONS.find((r) => r.id === id)?.label ?? id;
}

export type ContactReasonId = (typeof CONTACT_REASONS)[number]["id"];

export type ContactFlags = {
  allowMessages: boolean;
  allowParkingAlerts: boolean;
  allowVehicleIssues: boolean;
  allowDamageReports: boolean;
  allowEmergencyAlerts: boolean;
};

/**
 * Which VehicleProfile flag gates each reason. "always" means it only needs
 * allowMessages (the master switch) — it has no dedicated category flag.
 */
export const REASON_VISIBILITY: Record<ContactReasonId, keyof Omit<ContactFlags, "allowMessages"> | "always"> = {
  LIGHTS_ON: "allowParkingAlerts",
  MOVE_VEHICLE: "allowParkingAlerts",
  DOOR_OPEN: "allowParkingAlerts",
  VEHICLE_ISSUE: "allowVehicleIssues",
  DAMAGE: "allowDamageReports",
  SECURITY: "allowEmergencyAlerts",
  URGENT: "allowEmergencyAlerts",
  OTHER: "always",
};

export function visibleReasons(flags: ContactFlags): typeof CONTACT_REASONS[number][] {
  if (!flags.allowMessages) return [];
  return CONTACT_REASONS.filter((reason) => {
    const gate = REASON_VISIBILITY[reason.id];
    return gate === "always" || flags[gate];
  });
}

export type PublicVehicleView = {
  publicToken: string;
  vehicleName: string | null;
  vehicleType: (typeof VEHICLE_TYPES)[number] | null;
  vehiclePhotoUrl: string | null;
  registrationNumber: string | null;
  ownerName: string | null;
  ownerPhotoUrl: string | null;
  preferredName: string | null;
  contact: {
    allowMessages: boolean;
    allowParkingAlerts: boolean;
    allowVehicleIssues: boolean;
    allowDamageReports: boolean;
    allowEmergencyAlerts: boolean;
  };
};
