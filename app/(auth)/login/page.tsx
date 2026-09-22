import Link from "next/link";
import { PhoneOtpForm } from "@/components/auth/PhoneOtpForm";
import { GoogleSignInSection } from "@/components/auth/GoogleSignInSection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Log In" };

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Log in</CardTitle>
        <CardDescription>Enter your phone number and we&apos;ll text you a code.</CardDescription>
      </CardHeader>
      <CardContent>
        <GoogleSignInSection />
        <PhoneOtpForm mode="login" />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to PingMyCar?{" "}
          <Link href="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
            Get your QR
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
