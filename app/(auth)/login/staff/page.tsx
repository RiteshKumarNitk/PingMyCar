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
    <div className="text-center">
      <h1 className="text-2xl font-bold tracking-tight">Admin sign-in</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Staff access only. Vehicle owners should use Google.
      </p>
      <div className="mt-8 text-left">
        <EmailPasswordForm />
      </div>
      <Link href="/login" className="mt-6 inline-block text-sm text-muted-foreground underline-offset-4 hover:underline">
        Back to owner login
      </Link>
    </div>
  );
}
