import Link from "next/link";
import { PhoneOtpForm } from "@/components/auth/PhoneOtpForm";
import { GoogleSignInSection } from "@/components/auth/GoogleSignInSection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Get Your QR" };

export default function SignupPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Get your QR</CardTitle>
        <CardDescription>
          Enter your phone number to create your PingMyCar account. No password needed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <GoogleSignInSection />
        <PhoneOtpForm mode="signup" />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
