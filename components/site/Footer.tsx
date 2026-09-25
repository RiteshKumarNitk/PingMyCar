import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

export function Footer() {
  return (
    <footer className="bg-navy text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="[&_span]:text-white">
            <Logo />
          </div>
          <p className="mt-3 max-w-xs text-sm text-slate-400">
            Private communication for vehicles.
          </p>
        </div>

        <nav aria-label="Product">
          <h3 className="text-sm font-semibold text-white">Product</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/how-it-works" className="hover:text-white">
                How It Works
              </Link>
            </li>
            <li>
              <Link href="/for-owners" className="hover:text-white">
                For Owners
              </Link>
            </li>
            <li>
              <Link href="/stickers" className="hover:text-white">
                Stickers
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-white">
                FAQ
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Privacy and legal">
          <h3 className="text-sm font-semibold text-white">Privacy</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/privacy" className="hover:text-white">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/privacy-policy" className="hover:text-white">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white">
                Terms of Service
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Support">
          <h3 className="text-sm font-semibold text-white">Support</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/contact" className="hover:text-white">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white">
                Support
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-sm text-slate-400 sm:px-6">
          <span>© 2026 PingMyCar</span>
          {/* Deliberately subtle: staff entry point, not a public CTA. The
              /admin routes remain fully protected server-side. */}
          <Link href="/admin" className="text-xs text-slate-500 transition-colors hover:text-slate-300">
            Admin Login
          </Link>
        </div>
      </div>
    </footer>
  );
}
