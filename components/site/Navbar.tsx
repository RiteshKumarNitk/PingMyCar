import Link from "next/link";
import { Menu, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2" aria-label="PingMyCar home">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <QrCode className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-lg font-semibold tracking-tight">PingMyCar</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex" aria-label="Main">
          <Link href="/#how-it-works" className="transition-colors hover:text-foreground">
            How It Works
          </Link>
          <Link href="/#privacy" className="transition-colors hover:text-foreground">
            Privacy
          </Link>
          <Link href="/#faq" className="transition-colors hover:text-foreground">
            FAQ
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <Button asChild variant="ghost">
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Your QR</Link>
            </Button>
          </div>

          <Button asChild size="sm" className="sm:hidden">
            <Link href="/signup">Get Started</Link>
          </Button>

          {/* Native <details> dropdown — no client JS needed */}
          <details className="relative md:hidden">
            <summary
              className="flex h-9 w-9 list-none items-center justify-center rounded-md border border-input bg-background [&::-webkit-details-marker]:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </summary>
            <div className="absolute right-0 top-11 z-50 w-48 rounded-lg border border-border bg-card p-1 shadow-md">
              <Link href="/#how-it-works" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">
                How It Works
              </Link>
              <Link href="/#privacy" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">
                Privacy
              </Link>
              <Link href="/#faq" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">
                FAQ
              </Link>
              <Link href="/login" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">
                Log In
              </Link>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
