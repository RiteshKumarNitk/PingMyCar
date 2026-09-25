import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { postLoginPath } from "@/lib/onboarding";
import { GoogleSignInSection } from "@/components/auth/GoogleSignInSection";

export const metadata: Metadata = { title: "Get Your Free QR" };

export default async function SignupPage() {
  const session = await getSession();
  if (session) {
    redirect(await postLoginPath(session.user.id));
  }

  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold tracking-tight">
        Create your free PingMyCar account
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your vehicle can have its own private contact channel.
      </p>

      <div className="mt-8 text-left">
        <GoogleSignInSection label="Continue with Google" />
      </div>

      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        By continuing, you agree to the{" "}
        <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy-policy" className="underline underline-offset-4 hover:text-foreground">
          Privacy Policy
        </Link>
        .
      </p>

      <p className="mt-4 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
