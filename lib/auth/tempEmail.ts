/** RFC 2606 reserved TLD — guaranteed non-deliverable, never actually sent to. */
export const TEMP_EMAIL_DOMAIN = "phone.pingmycar.invalid";

export function tempEmailFor(phoneNumber: string): string {
  return `${phoneNumber.replace(/[^0-9]/g, "")}@${TEMP_EMAIL_DOMAIN}`;
}

/** True for the placeholder email phone-only signups get — never a real inbox. */
export function isTempEmail(email: string): boolean {
  return email.endsWith(`@${TEMP_EMAIL_DOMAIN}`);
}
