import { defineConfig } from "@neon/config/v1";

/**
 * Neon project config.
 *
 * Auth note: PingMyCar's authentication is Better Auth (Google OAuth +
 * phone OTP) with its own Prisma tables — Neon Auth is intentionally NOT
 * enabled here so there is a single authoritative user identity (§17).
 *
 * The `userprofile` bucket stays private: browsers only ever receive
 * short-lived pre-signed URLs minted server-side (lib/storage/s3.ts).
 */
export default defineConfig({
  auth: false,
  preview: {
    buckets: {
      userprofile: { access: "private" },
    },
    functions: {
      api: { name: "api", source: "./hello.ts" },
    },
  },
});
