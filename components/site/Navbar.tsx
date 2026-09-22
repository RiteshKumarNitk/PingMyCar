import Link from "next/link";
import { Menu, LayoutDashboard } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/Logo";

export async function Navbar() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex" aria-label="Main">
          <Link href="/how-it-works" className="transition-colors hover:text-foreground">
            How It Works
          </Link>
          <Link href="/for-owners" className="transition-colors hover:text-foreground">
            For Owners
          </Link>
          <Link href="/stickers" className="transition-colors hover:text-foreground">
            Stickers
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-foreground">
            Privacy
          </Link>
          <Link href="/faq" className="transition-colors hover:text-foreground">
            FAQ
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {session ? (
            <Button asChild size="sm">
              <Link href="/dashboard">
                <LayoutDashboard className="h-4 w-4" aria-hidden />
                Dashboard
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Get Your Free QR</Link>
              </Button>
            </>
          )}

          {/* Native <details> dropdown — works without client JS */}
          <details className="relative md:hidden">
            <summary
              className="flex h-9 w-9 list-none items-center justify-center rounded-md border border-input bg-background [&::-webkit-details-marker]:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </summary>
            <div className="absolute right-0 top-11 z-50 w-52 rounded-lg border border-border bg-card p-1.5 shadow-md">
              <Link href="/how-it-works" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">
                How It Works
              </Link>
              <Link href="/for-owners" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">
                For Owners
              </Link>
              <Link href="/stickers" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">
                Stickers
              </Link>
              <Link href="/privacy" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">
                Privacy
              </Link>
              <Link href="/faq" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">
                FAQ
              </Link>
              <div className="my-1 h-px bg-border" />
              {session ? (
                <Link href="/dashboard" className="block rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-accent">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">
                    Log In
                  </Link>
                  <Link href="/signup" className="block rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-accent">
                    Get Your Free QR
                  </Link>
                </>
              )}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
