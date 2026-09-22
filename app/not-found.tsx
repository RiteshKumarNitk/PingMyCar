import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <Logo />
      <span className="mt-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <SearchX className="h-7 w-7" aria-hidden />
      </span>
      <h1 className="mt-5 text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        If you scanned a QR sticker, double-check the code — or the sticker may be
        inactive or outdated.
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/contact">Contact Support</Link>
        </Button>
      </div>
    </div>
  );
}
