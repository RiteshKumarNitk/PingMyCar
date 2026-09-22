"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = "phone" | "otp";

/**
 * Phone-OTP fallback auth. Deliberately secondary: Google is the primary
 * flow, this stays collapsed behind a disclosure so it never competes with it.
 */
export function PhoneOtpForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSendCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await authClient.phoneNumber.sendOtp({ phoneNumber });
    setLoading(false);
    if (error) {
      setError(error.message ?? "Couldn't send a code to that number. Check it and try again.");
      return;
    }
    setStep("otp");
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await authClient.phoneNumber.verify({ phoneNumber, code });
    setLoading(false);
    if (error) {
      setError(error.message ?? "That code didn't work. Try again.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  if (step === "otp") {
    return (
      <form onSubmit={handleVerify} className="space-y-5">
        <div>
          <p className="text-sm text-muted-foreground">
            We sent a code to <span className="font-medium text-foreground">{phoneNumber}</span>.
          </p>
          {process.env.NODE_ENV !== "production" && (
            <p className="mt-1 text-xs text-muted-foreground">
              Dev mode: no SMS provider is configured — check the server console for the code.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="code">Verification code</Label>
          <Input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            required
            autoFocus
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading || code.length < 4}>
          {loading ? "Verifying…" : "Verify and continue"}
        </Button>

        <button
          type="button"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          onClick={() => {
            setStep("phone");
            setCode("");
            setError(null);
          }}
        >
          Use a different number
        </button>
      </form>
    );
  }

  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
        Continue with phone instead
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
      </summary>

      <form onSubmit={handleSendCode} className="mt-4 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone number</Label>
          <Input
            id="phoneNumber"
            type="tel"
            autoComplete="tel"
            placeholder="+1 555 123 4567"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">Include your country code.</p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" variant="outline" className="w-full" disabled={loading || phoneNumber.trim().length < 8}>
          {loading ? "Sending…" : mode === "login" ? "Log in with code" : "Create account with code"}
        </Button>
      </form>
    </details>
  );
}
