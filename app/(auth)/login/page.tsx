import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { postLoginPath } from "@/lib/onboarding";
import { GoogleSignInSection } from "@/components/auth/GoogleSignInSection";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Log In" };

/** Better Auth OAuth callback error codes (?error=…) → what the user can do about it. */
const LOGIN_ERRORS: Record<string, string> = {
  access_denied: "Google sign-in was cancelled.",
  account_not_linked:
    "This email already has a PingMyCar account that isn't linked to Google. Contact support to link it.",
  unable_to_link_account:
    "This email already has a PingMyCar account that isn't linked to Google. Contact support to link it.",
  email_not_found: "Your Google account didn't share an email address, which PingMyCar needs.",
  state_not_found: "Your sign-in session expired. Please try again.",
  state_mismatch: "Your sign-in session expired. Please try again.",
};

function loginErrorMessage(code: string): string {
  return LOGIN_ERRORS[code] ?? "Google sign-in didn't complete. Please try again.";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const session = await getSession();
  if (session) {
    redirect(await postLoginPath(session.user.id));
  }

  const { error } = await searchParams;
  const errorCode = typeof error === "string" ? error : undefined;

  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Contact your vehicle. Keep your number private.
      </p>

      {errorCode && (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-left text-sm text-destructive"
        >
          {loginErrorMessage(errorCode)}
          {/* The raw code (never sensitive) makes support reports actionable. */}
          <span className="mt-1 block text-xs opacity-70">Error code: {errorCode.slice(0, 64)}</span>
        </div>
      )}

      <div className="mt-8 text-left">
        <GoogleSignInSection />
      </div>

      <div className="mt-8 border-t border-border pt-6">
        <p className="text-sm text-muted-foreground">New to PingMyCar?</p>
        <Button asChild variant="outline" className="mt-3 w-full">
          <Link href="/signup">Get Your Free QR</Link>
        </Button>
      </div>

      <p className="mt-10 text-center text-xs text-muted-foreground">
        <Link href="/login/staff" className="underline-offset-4 hover:underline">
          Admin sign-in
        </Link>
      </p>
    </div>
  );
}
