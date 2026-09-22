import type { APIRequestContext } from "@playwright/test";

/**
 * Reads the OTP the dev sendOTP fallback stashed for this phone number.
 * Callers must await the send-otp network response before calling this, so
 * the server has already recorded the code.
 */
export async function getOtp(request: APIRequestContext, phoneNumber: string): Promise<string> {
  const res = await request.get(`/api/test/last-otp?phoneNumber=${encodeURIComponent(phoneNumber)}`);
  if (!res.ok()) {
    throw new Error(`No OTP found for ${phoneNumber} (status ${res.status()})`);
  }
  const { code } = (await res.json()) as { code: string };
  return code;
}
