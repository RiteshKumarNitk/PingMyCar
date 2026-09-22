import { Resend } from "resend";

/**
 * No email provider is required to run this app locally. Without
 * RESEND_API_KEY, the email is logged to the server console instead of sent
 * — same dev-fallback pattern as the phone OTP in lib/auth/index.ts.
 */
export async function sendEmail({ to, subject, text }: { to: string; subject: string; text: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ALERT_EMAIL_FROM ?? "PingMyCar <onboarding@resend.dev>";

  if (!apiKey) {
    console.log(`[dev email] to=${to} subject="${subject}"\n${text}`);
    return;
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({ from, to, subject, text });
  if (error) {
    console.error("[email] send failed:", error);
  }
}
