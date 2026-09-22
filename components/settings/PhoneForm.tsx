"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = "phone" | "otp";

export function PhoneForm({ currentPhone }: { currentPhone: string | null }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSendCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await authClient.phoneNumber.sendOtp({ phoneNumber });
    setLoading(false);
    if (error) {
      setError(error.message ?? "Couldn't send a code to that number.");
      return;
    }
    setStep("otp");
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await authClient.phoneNumber.verify({ phoneNumber, code, updatePhoneNumber: true });
    setLoading(false);
    if (error) {
      setError(error.message ?? "That code didn't work. Try again.");
      return;
    }
    // The session cookie is cached for a few minutes — force a fresh fetch so
    // the new number shows immediately instead of the old cached one.
    await authClient.getSession({ query: { disableCookieCache: true } });
    setSaved(true);
    setStep("phone");
    setPhoneNumber("");
    setCode("");
    router.refresh();
  }

  if (step === "otp") {
    return (
      <form onSubmit={handleVerify} className="space-y-3">
        <p className="text-sm text-muted-foreground">
          We sent a code to <span className="font-medium text-foreground">{phoneNumber}</span>.
        </p>
        {process.env.NODE_ENV !== "production" && (
          <p className="text-xs text-muted-foreground">Dev mode: check the server console for the code.</p>
        )}
        <div className="space-y-2">
          <Label htmlFor="settingsPhoneCode">Verification code</Label>
          <Input
            id="settingsPhoneCode"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            required
            autoFocus
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" disabled={loading || code.length < 4}>
            {loading ? "Verifying…" : "Verify"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setStep("phone");
              setCode("");
              setError(null);
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSendCode} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="settingsPhone">{currentPhone ? "New phone number" : "Phone number"}</Label>
        <Input
          id="settingsPhone"
          type="tel"
          placeholder="+1 555 123 4567"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={loading || phoneNumber.trim().length < 8}>
          {loading ? "Sending…" : "Send code"}
        </Button>
        {saved && <span className="text-sm text-muted-foreground">Updated.</span>}
      </div>
    </form>
  );
}
