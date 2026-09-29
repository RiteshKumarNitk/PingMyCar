import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { isTempEmail } from "@/lib/auth/tempEmail";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmailForm } from "@/components/settings/EmailForm";
import { DeleteAccount } from "@/components/settings/DeleteAccount";
import { ArrowRight } from "lucide-react";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await requireSession();
  const { user } = session;
  const hasRealEmail = !isTempEmail(user.email);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="eyebrow">Account</p>
        <h1 className="page-title mt-1.5">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          How we reach you when a message arrives.
        </p>
      </div>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">Email</CardTitle>
          <CardDescription>Where message notifications get sent.</CardDescription>
        </CardHeader>
        <CardContent>
          <EmailForm currentEmail={hasRealEmail ? user.email : ""} hasRealEmail={hasRealEmail} />
        </CardContent>
      </Card>


      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">More</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <Button asChild variant="ghost" size="sm" className="w-full justify-between">
            <Link href="/dashboard/profile">
              Edit your profile (name, photo)
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="w-full justify-between">
            <Link href="/dashboard/stickers">
              Sticker files and placement guidance
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base">Delete account</CardTitle>
          <CardDescription>
            <Link href="/delete-account" className="underline-offset-4 hover:underline">
              What gets deleted
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccount />
        </CardContent>
      </Card>
    </div>
  );
}
