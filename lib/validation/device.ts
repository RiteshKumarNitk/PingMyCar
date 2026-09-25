import { z } from "zod";
import { DevicePlatform } from "@prisma/client";

export const registerDeviceSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

/**
 * Mobile (Flutter) FCM device registration. A device id lets the same
 * physical device replace its own token (FCM rotates tokens) without a
 * second row; other devices are never touched.
 */
export const registerFcmDeviceSchema = z.object({
  token: z.string().trim().min(32).max(4096),
  platform: z.enum([DevicePlatform.ANDROID, DevicePlatform.IOS]),
  deviceId: z.string().trim().min(8).max(255).optional(),
});

export type RegisterFcmDeviceInput = z.infer<typeof registerFcmDeviceSchema>;
