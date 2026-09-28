import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { postLoginPath } from "@/lib/onboarding";
import { Check } from "lucide-react";
import { GoogleSignInSection } from "@/components/auth/GoogleSignInSection";

export const metadata: Metadata = { title: "Get Your Free QR" };

export default async function SignupPage() {
  const session = await getSession();
  if (session) {
    redirect(await postLoginPath(session.user.id));
  }

  return (
    <div>
      <h1 className="page-title">Get your free QR</h1>
      <p className="supporting mt-1.5">
        Create your owner account with Google. Your vehicle gets its own private contact channel.
      </p>

      <div className="mt-7">
        <GoogleSignInSection label="Continue with Google" />
      </div>

      <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
        {["Free — no app needed", "Your number and email stay private", "Set up your first QR in a minute"].map((t) => (
          <li key={t} className="flex items-center gap-2">
            <Check className="size-4 shrink-0 text-success" aria-hidden />
            {t}
          </li>
        ))}
      </ul>

      <p className="meta mt-6 leading-relaxed">
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

      <p className="mt-6 border-t border-border pt-5 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
