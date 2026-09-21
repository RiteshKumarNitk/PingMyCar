import type { Vehicle, VehicleProfile, User } from "@prisma/client";
import type { PublicVehicleView } from "@/types";

/**
 * Shapes DB rows into exactly what a visitor is allowed to see. This is the
 * privacy boundary for the public page — every field here is gated by the
 * owner's own visibility toggles, and nothing else from Vehicle/User ever
 * leaves this function (no ownerId, email, phone, raw tokens, etc).
 */
export function buildPublicVehicleView(
  vehicle: Vehicle,
  profile: VehicleProfile,
  owner: Pick<User, "name" | "preferredName" | "image" | "phoneNumber">
): PublicVehicleView {
  // A name that still equals the login phone number was never actually set
  // by the owner — never publish it, regardless of the toggle state.
  const hasRealName = Boolean(owner.name) && owner.name !== owner.phoneNumber;

  const ownerName =
    profile.showPreferredName && owner.preferredName
      ? owner.preferredName
      : profile.showOwnerName && hasRealName
        ? owner.name
        : null;

  return {
    publicToken: vehicle.publicToken,
    vehicleName: profile.showVehicleName ? vehicle.name : null,
    vehicleType: profile.showVehicleType ? vehicle.type : null,
    vehiclePhotoUrl: profile.showVehiclePhoto ? vehicle.photoUrl : null,
    registrationNumber: profile.showRegistrationNumber ? vehicle.registrationNumber : null,
    ownerName,
    ownerPhotoUrl: profile.showOwnerPhoto ? owner.image : null,
    preferredName: profile.showPreferredName ? owner.preferredName : null,
    contact: {
      allowMessages: profile.allowMessages,
      allowParkingAlerts: profile.allowParkingAlerts,
      allowVehicleIssues: profile.allowVehicleIssues,
      allowDamageReports: profile.allowDamageReports,
      allowEmergencyAlerts: profile.allowEmergencyAlerts,
    },
  };
}
