import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { hasRealName } from "@/lib/onboarding";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Get Set Up" };

export default async function OnboardingPage() {
  const session = await requireSession();

  const needsName = !hasRealName(session.user.name, session.user.phoneNumber);
  const vehicleCount = await prisma.vehicle.count({ where: { ownerId: session.user.id } });
  const needsVehicle = vehicleCount === 0;

  if (!needsName && !needsVehicle) redirect("/dashboard");

  return (
    <div className="w-full">
      <div className="mb-6 text-center">
        <p className="eyebrow">Welcome to PingMyCar 👋</p>
        <CardTitle className="mt-2 text-2xl font-bold tracking-tight">
          Let&apos;s connect your first vehicle.
        </CardTitle>
        <CardDescription className="mt-1.5">
          Step 1 of 2 — add your vehicle, then get your QR.
        </CardDescription>
      </div>

      <Card className="border-0 shadow-none">
        <CardContent>
          <OnboardingForm needsName={needsName} needsVehicle={needsVehicle} />
        </CardContent>
      </Card>

      <ol className="mt-6 space-y-1.5 text-center text-xs text-muted-foreground">
        <li>1. Add your vehicle · 2. Generate your QR · 3. Print your sticker</li>
        <li>4. Put it on your vehicle · 5. Start receiving messages</li>
      </ol>
    </div>
  );
}
