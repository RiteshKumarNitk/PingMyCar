import { z } from "zod";
import { CONTACT_REASONS } from "@/types";

const REASON_IDS = CONTACT_REASONS.map((r) => r.id) as [string, ...string[]];

const maxChars = Number(process.env.MESSAGE_MAX_CHARS ?? 500);

export const startConversationSchema = z.object({
  publicToken: z.string().trim().min(1),
  reason: z.enum(REASON_IDS),
  body: z.string().trim().min(1, "Message is required").max(maxChars),
});

export const replyMessageSchema = z.object({
  body: z.string().trim().min(1, "Message is required").max(maxChars),
});

export type StartConversationInput = z.infer<typeof startConversationSchema>;
export type ReplyMessageInput = z.infer<typeof replyMessageSchema>;
