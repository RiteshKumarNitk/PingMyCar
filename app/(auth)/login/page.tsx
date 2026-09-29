import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { postLoginPath } from "@/lib/onboarding";
import { GoogleSignInSection } from "@/components/auth/GoogleSignInSection";
import { ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Log In" };

/** Better Auth OAuth callback error codes (?error=…) → what the user can do about it. */
const LOGIN_ERRORS: Record<string, string> = {
  access_denied: "Google sign-in was cancelled.",
  account_not_linked:
    "This email already has a OwnerPing account that isn't linked to Google. Contact support to link it.",
  unable_to_link_account:
    "This email already has a OwnerPing account that isn't linked to Google. Contact support to link it.",
  email_not_found: "Your Google account didn't share an email address, which OwnerPing needs.",
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
    <div>
      <h1 className="page-title">Sign in to OwnerPing</h1>
      <p className="supporting mt-1.5">Vehicle owners sign in with Google to manage vehicles, QR codes, and messages.</p>

      {errorCode && (
        <div role="alert" className="mt-6 rounded-lg bg-danger-bg px-4 py-3 text-sm text-danger">
          {loginErrorMessage(errorCode)}
          {/* The raw code (never sensitive) makes support reports actionable. */}
          <span className="mt-1 block text-xs opacity-70">Error code: {errorCode.slice(0, 64)}</span>
        </div>
      )}

      <div className="mt-7">
        <GoogleSignInSection />
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-lg bg-surface-2 px-3.5 py-3">
        <ScanLine className="mt-0.5 size-4 shrink-0 text-comm" aria-hidden />
        <p className="text-sm leading-snug text-muted-foreground">
          <span className="font-medium text-foreground">Scanned a QR sticker?</span> You don&apos;t need an
          account — just send your message from the vehicle&apos;s page.
        </p>
      </div>

      <div className="mt-7 border-t border-border pt-6 text-center">
        <p className="text-sm text-muted-foreground">New to OwnerPing?</p>
        <Button asChild variant="outline" className="mt-3 w-full">
          <Link href="/signup">Get Your Free QR</Link>
        </Button>
      </div>

      <p className="mt-8 text-center">
        <Link href="/login/staff" className="meta rounded-sm underline-offset-4 hover:text-foreground hover:underline">
          Staff sign-in
        </Link>
      </p>
    </div>
  );
}
