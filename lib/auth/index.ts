import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { bearer } from "better-auth/plugins/bearer";
import { prisma } from "../db";
import { isTempEmail } from "./tempEmail";
import { sendEmail } from "@/lib/notifications/email";

const isProd = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);

/**
 * Owner authentication is Google-only. There is no phone/OTP login, no
 * email OTP or magic link, and no public email/password sign-up (see
 * emailAndPassword below). Guests are unauthenticated visitors using the
 * public QR/visitor-token flow and never get an account.
 */

const appUrl =
  process.env.BETTER_AUTH_URL ||
  (isProd && process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined) ||
  (isProd && process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
  (process.env.NEXT_PUBLIC_APP_URL && (!isProd || !process.env.NEXT_PUBLIC_APP_URL.includes("localhost"))
    ? process.env.NEXT_PUBLIC_APP_URL
    : undefined) ||
  (isProd ? "https://ping-my-car.vercel.app" : "http://localhost:3100");

if (isProd && (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET)) {
  console.warn("[auth] Google OAuth is not fully configured for production. Social sign-in will fail until GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set.");
}

const trustedOrigins = [
  "http://localhost:3100",
  "http://127.0.0.1:3100",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://rajweb-sage.vercel.app",
  "https://ping-my-car.vercel.app",
  ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : []),
  ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ...(process.env.VERCEL_PROJECT_PRODUCTION_URL ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`] : []),
];

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET,
  baseURL: appUrl,
  trustedOrigins: Array.from(new Set(trustedOrigins.filter(Boolean))),
  // OAuth failures land on /login (which explains ?error=…) instead of
  // Better Auth's bare /api/auth/error page.
  onAPIError: { errorURL: "/login" },
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  // Sign-in only, for pre-provisioned staff accounts on /login/staff. Public
  // sign-up is disabled: owners can only be created through Google.
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  // changeEmail's "no verification needed for an unverified current email"
  // fast path still requires this base capability to be configured, even
  // though we never trigger it automatically (sendOnSignUp/sendOnSignIn: false).
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      if (isTempEmail(user.email)) return;
      await sendEmail({
        to: user.email,
        subject: "Verify your PingMyCar email",
        text: `Confirm this email address: ${url}`,
      });
    },
    sendOnSignUp: false,
    sendOnSignIn: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
  user: {
    additionalFields: {
      preferredName: {
        type: "string",
        required: false,
      },
      // Legacy data from the removed phone login. Read-only (input: false):
      // kept so older accounts' names/profiles still resolve; never settable.
      phoneNumber: {
        type: "string",
        required: false,
        input: false,
      },
    },
    changeEmail: {
      enabled: true,
      // Phone-signup accounts have a temp, never-verified email — apply the
      // change immediately instead of requiring a click-through on the new one.
      updateEmailWithoutVerification: true,
      // The temp placeholder email (phone-only signups) was never verified,
      // so there's nothing meaningful to notify — skip it silently.
      sendChangeEmailConfirmation: async ({ user, newEmail }) => {
        if (isTempEmail(user.email)) return;
        await sendEmail({
          to: user.email,
          subject: "Your PingMyCar email was changed",
          text: `Your account email was changed to ${newEmail}. If this wasn't you, contact support immediately.`,
        });
      },
    },
  },
  plugins: [
    nextCookies(),
    // Lets the Flutter owner app authenticate with the SAME session system:
    // the mobile sign-in response carries the session token in a
    // `set-auth-token` response header, which the app echoes back as
    // `Authorization: Bearer <token>` on every API call. Same User/Session
    // tables, same 30-day expiry — no second auth mechanism.
    bearer(),
  ],
});

export type Session = typeof auth.$Infer.Session;
