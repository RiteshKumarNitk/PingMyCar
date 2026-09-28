"use client";

import { useEffect, useState } from "react";

/**
 * Time-of-day greeting derived from the *client* clock — the dashboard is a
 * server component, and a server-side hour would render in the server's
 * timezone, not the owner's. Rendered only after mount so SSR output and
 * client hydration never disagree (avoids a hydration mismatch).
 */
export function Greeting({ firstName }: { firstName?: string }) {
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");
  }, []);

  const base = greeting || "Welcome";
  return <h1 className="page-title">{firstName ? `${base}, ${firstName}` : base}</h1>;
}
