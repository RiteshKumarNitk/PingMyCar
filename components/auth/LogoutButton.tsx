"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      variant="ghost"
      size="sm"
      loading={pending}
      aria-label="Log out"
      onClick={async () => {
        setPending(true);
        await authClient.signOut();
        router.push("/");
        router.refresh();
      }}
    >
      {!pending && <LogOut aria-hidden />}
      <span className="hidden sm:inline">Log out</span>
    </Button>
  );
}
