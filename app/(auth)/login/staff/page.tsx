import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { postLoginPath } from "@/lib/onboarding";
import { EmailPasswordForm } from "@/components/auth/EmailPasswordForm";

export const metadata: Metadata = { title: "Admin sign-in" };

export default async function StaffLoginPage() {
  const session = await getSession();
  if (session) {
    redirect(await postLoginPath(session.user.id));
  }

  return (
    <div>
      <p className="eyebrow">Staff only</p>
      <h1 className="page-title mt-1.5">Admin sign-in</h1>
      <p className="supporting mt-1.5">For pre-provisioned staff accounts. Vehicle owners sign in with Google.</p>
      <div className="mt-7">
        <EmailPasswordForm />
      </div>
      <p className="mt-6 text-center">
        <Link href="/login" className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          ← Back to owner sign-in
        </Link>
      </p>
    </div>
  );
}
