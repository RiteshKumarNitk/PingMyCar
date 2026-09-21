import { createAuthClient } from "better-auth/react";
import { phoneNumberClient, inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3100",
  plugins: [phoneNumberClient(), inferAdditionalFields<typeof auth>()],
});
