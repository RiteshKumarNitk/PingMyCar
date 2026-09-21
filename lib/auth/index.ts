import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { phoneNumber } from "better-auth/plugins/phone-number";
import { prisma } from "../db";

/**
 * No SMS provider is wired up yet (dev fallback per ARCHITECTURE.md).
 * The OTP is logged to the server console so the phone-OTP flow can be
 * exercised end-to-end locally. Swap this for a real SMS send (Twilio, etc.)
 * before production.
 */
async function sendOTP({ phoneNumber, code }: { phoneNumber: string; code: string }) {
  console.log(`[dev OTP] ${phoneNumber} -> ${code}`);
}

export const auth = betterAuth({
  secret: process.env.AUTH_SECRET,
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3100",
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
  user: {
    additionalFields: {
      preferredName: {
        type: "string",
        required: false,
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
        getTempEmail: (phoneNumber) => `${phoneNumber.replace(/[^0-9]/g, "")}@phone.pingmycar.invalid`,
        getTempName: (phoneNumber) => phoneNumber,
      },
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
