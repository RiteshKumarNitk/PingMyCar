import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { hasRealName } from "@/lib/onboarding";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IdentityForm } from "@/components/settings/IdentityForm";
import { EnableNotifications } from "@/components/dashboard/EnableNotifications";
import { ArrowRight } from "lucide-react";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await requireSession();
  const { user } = session;
  const displayName = hasRealName(user.name, user.phoneNumber) ? user.name : "";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="eyebrow">Account</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          How you appear on your vehicles&apos; contact pages — if you choose to appear at all.
        </p>
      </div>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">Your identity</CardTitle>
          <CardDescription>
            Used across every vehicle&apos;s contact profile. Nothing is shown unless you
            enable it per vehicle.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IdentityForm
            initialName={displayName}
            initialPreferredName={user.preferredName ?? ""}
            initialPhotoUrl={user.image ?? ""}
          />
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">Notifications</CardTitle>
          <CardDescription>Get browser alerts when someone messages you.</CardDescription>
        </CardHeader>
        <CardContent>
          <EnableNotifications />
          <Button asChild variant="ghost" size="sm" className="mt-2">
            <Link href="/dashboard/settings">
              Manage email &amp; phone
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
