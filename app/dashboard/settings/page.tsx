import { requireSession } from "@/lib/auth/session";
import { isTempEmail } from "@/lib/auth/tempEmail";
import { hasRealName } from "@/lib/onboarding";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IdentityForm } from "@/components/settings/IdentityForm";
import { EmailForm } from "@/components/settings/EmailForm";
import { PhoneForm } from "@/components/settings/PhoneForm";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await requireSession();
  const { user } = session;

  const hasRealEmail = !isTempEmail(user.email);
  const displayName = hasRealName(user.name, user.phoneNumber) ? user.name : "";

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your identity</CardTitle>
          <CardDescription>Used across every vehicle&apos;s contact profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <IdentityForm
            initialName={displayName}
            initialPreferredName={user.preferredName ?? ""}
            initialPhotoUrl={user.image ?? ""}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Email</CardTitle>
          <CardDescription>Where message notifications get sent.</CardDescription>
        </CardHeader>
        <CardContent>
          <EmailForm currentEmail={hasRealEmail ? user.email : ""} hasRealEmail={hasRealEmail} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Phone</CardTitle>
          <CardDescription>Used to log in with a one-time code.</CardDescription>
        </CardHeader>
        <CardContent>
          {user.phoneNumber && <p className="mb-3 text-sm">{user.phoneNumber}</p>}
          <PhoneForm currentPhone={user.phoneNumber ?? null} />
        </CardContent>
      </Card>
    </div>
  );
}
