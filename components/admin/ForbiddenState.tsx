import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * 403 fallback for authenticated users who hit /admin without the required
 * permission. Never reveals whether admin features exist — the same neutral
 * wording is shown for any insufficient role.
 */
export function ForbiddenState() {
  return (
    <Card className="mx-auto mt-10 max-w-md rounded-xl text-center">
      <CardContent className="flex flex-col items-center gap-4 p-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10 text-warning">
          <ShieldAlert className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Access denied</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your account does not have permission to view this area. If you
            believe this is a mistake, contact the platform team.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
