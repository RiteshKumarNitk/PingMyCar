"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

/** Renders nothing (button + divider) until GOOGLE_CLIENT_ID is actually configured. */
export function GoogleSignInSection() {
  const [loading, setLoading] = useState(false);

  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) return null;

  return (
    <div className="mb-5 space-y-5">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={loading}
        onClick={() => {
          setLoading(true);
          authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" });
        }}
      >
        {loading ? "Redirecting…" : "Continue with Google"}
      </Button>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
