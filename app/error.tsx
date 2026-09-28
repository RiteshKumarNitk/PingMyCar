"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/shared/ErrorState";

/** App-wide error boundary: a friendly 500 (or offline) with a retry, never a stack trace. */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const offline = typeof navigator !== "undefined" && navigator.onLine === false;
  return (
    <div className="flex min-h-[60dvh] items-center justify-center">
      <ErrorState
        kind={offline ? "network" : 500}
        primary={{ label: "Try again", onClick: reset }}
        secondary={{ label: "Go Home", href: "/" }}
      />
    </div>
  );
}
