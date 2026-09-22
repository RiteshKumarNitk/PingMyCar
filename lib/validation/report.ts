import { z } from "zod";

export const reportConversationSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});
