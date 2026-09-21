import { z } from "zod";

export const VEHICLE_TYPES = ["CAR", "BIKE", "SCOOTER", "TRUCK", "VAN", "OTHER"] as const;

export const VEHICLE_TYPE_LABELS: Record<(typeof VEHICLE_TYPES)[number], string> = {
  CAR: "Car",
  BIKE: "Motorcycle",
  SCOOTER: "Scooter",
  TRUCK: "Truck",
  VAN: "Van",
  OTHER: "Other",
};

const registrationNumber = z
  .string()
  .trim()
  .max(20)
  .optional()
  .transform((v) => (v ? v : undefined));

const photoUrl = z
  .string()
  .trim()
  .url()
  .max(2048)
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : undefined));

export const createVehicleSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  type: z.enum(VEHICLE_TYPES).optional(),
  registrationNumber,
});

export const updateVehicleSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80).optional(),
  type: z.enum(VEHICLE_TYPES).optional(),
  registrationNumber,
  photoUrl,
  qrActive: z.boolean().optional(),
  /** Rotates publicToken; old sticker URLs 404 afterward. */
  regenerateToken: z.boolean().optional(),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
