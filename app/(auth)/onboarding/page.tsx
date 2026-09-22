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
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Let&apos;s get you set up</CardTitle>
        <CardDescription>Just a couple of things before your dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        <OnboardingForm needsName={needsName} needsVehicle={needsVehicle} />
      </CardContent>
    </Card>
  );
}
