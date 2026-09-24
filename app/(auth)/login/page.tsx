import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { postLoginPath } from "@/lib/onboarding";
import { GoogleSignInSection } from "@/components/auth/GoogleSignInSection";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Log In" };

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect(await postLoginPath(session.user.id));
  }

  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Contact your vehicle. Keep your number private.
      </p>

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
