import { z } from "zod";

export const updateVehicleProfileSchema = z.object({
  showVehicleName: z.boolean().optional(),
  showVehicleType: z.boolean().optional(),
  showVehiclePhoto: z.boolean().optional(),
  showRegistrationNumber: z.boolean().optional(),
  showOwnerName: z.boolean().optional(),
  showOwnerPhoto: z.boolean().optional(),
  showPreferredName: z.boolean().optional(),
  allowMessages: z.boolean().optional(),
  allowParkingAlerts: z.boolean().optional(),
  allowVehicleIssues: z.boolean().optional(),
  allowDamageReports: z.boolean().optional(),
  allowEmergencyAlerts: z.boolean().optional(),
});

export type UpdateVehicleProfileInput = z.infer<typeof updateVehicleProfileSchema>;
