/**
 * Dev/test-only in-memory record of the last OTP sent per phone number.
 * Populated by the dev sendOTP fallback in lib/auth/index.ts, read by the
 * gated /api/test/last-otp route so the e2e suite doesn't have to scrape
 * server logs. Never wired into anything reachable in production.
 */
const lastOtpByPhone = new Map<string, string>();

export function setLastOtp(phoneNumber: string, code: string) {
  lastOtpByPhone.set(phoneNumber, code);
}

export function getLastOtp(phoneNumber: string): string | undefined {
  return lastOtpByPhone.get(phoneNumber);
}
