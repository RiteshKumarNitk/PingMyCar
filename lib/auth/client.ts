import { createAuthClient } from "better-auth/react";
import { phoneNumberClient, inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

export const authClient = createAuthClient({
  // No baseURL: the client must hit the origin the page was actually loaded
  // from (localhost vs 127.0.0.1 vs the prod domain). A hardcoded absolute
  // URL makes every auth call cross-origin — and Better Auth's preflight
  // fails, so sign-in dies with "Failed to fetch" on any other hostname.
  plugins: [phoneNumberClient(), inferAdditionalFields<typeof auth>()],
});
