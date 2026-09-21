import Link from "next/link";
import { QrCode } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <QrCode className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-lg font-semibold tracking-tight">PingMyCar</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Private communication for vehicles.
          </p>
        </div>

        <nav aria-label="Product">
          <h3 className="text-sm font-semibold">Product</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/#how-it-works" className="hover:text-foreground">
                How It Works
              </Link>
            </li>
            <li>
              <Link href="/#privacy" className="hover:text-foreground">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/#faq" className="hover:text-foreground">
                FAQ
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Legal">
          <h3 className="text-sm font-semibold">Legal</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/privacy" className="hover:text-foreground">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-foreground">
                Terms of Service
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Contact">
          <h3 className="text-sm font-semibold">Contact</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <a href="mailto:support@pingmycar.app" className="hover:text-foreground">
                Support
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
