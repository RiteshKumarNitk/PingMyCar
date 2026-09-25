import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { phoneNumber } from "better-auth/plugins/phone-number";
import { bearer } from "better-auth/plugins/bearer";
import { prisma } from "../db";
import { tempEmailFor, isTempEmail } from "./tempEmail";
import { sendEmail } from "@/lib/notifications/email";
import { setLastOtp } from "./otpStore";

/**
 * No SMS provider is wired up yet (dev fallback per ARCHITECTURE.md).
 * The OTP is logged to the server console so the phone-OTP flow can be
 * exercised end-to-end locally, and stashed in-memory for the e2e suite to
 * read via /api/test/last-otp. Swap this for a real SMS send (Twilio, etc.)
 * before production.
 */
async function sendOTP({ phoneNumber, code }: { phoneNumber: string; code: string }) {
  console.log(`[dev OTP] ${phoneNumber} -> ${code}`);
  setLastOtp(phoneNumber, code);
}

export const auth = betterAuth({
  secret: process.env.AUTH_SECRET,
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3100",
  // The dev server is reachable as both localhost and 127.0.0.1; trust both
  // origins so auth requests never fail the origin check on either hostname.
  // (The production origin comes from NEXT_PUBLIC_APP_URL via baseURL.)
  trustedOrigins: ["http://localhost:3100", "http://127.0.0.1:3100"],
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
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
    phoneNumber({
      sendOTP,
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 3,
      phoneNumberValidator: (phoneNumber) => /^\+?[1-9]\d{7,14}$/.test(phoneNumber),
      signUpOnVerification: {
        getTempEmail: tempEmailFor,
        getTempName: (phoneNumber) => phoneNumber,
      },
    }),
    // Lets the Flutter owner app authenticate with the SAME session system:
    // the mobile sign-in response carries the session token in a
    // `set-auth-token` response header, which the app echoes back as
    // `Authorization: Bearer <token>` on every API call. Same User/Session
    // tables, same 30-day expiry — no second auth mechanism.
    bearer(),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
