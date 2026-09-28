import Link from "next/link";
import { EyeOff, MessageSquareLock, QrCode } from "lucide-react";
import { Logo } from "@/components/shared/Logo";

const POINTS = [
  { icon: QrCode, text: "A private QR code for each of your vehicles" },
  { icon: MessageSquareLock, text: "People message you through PingMyCar" },
  { icon: EyeOff, text: "Your phone number and email are never shown" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Brand panel — desktop only */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-navy p-12 text-white lg:flex">
        <Logo inverse />
        <div className="max-w-md">
          <p className="eyebrow text-comm">Privacy-first vehicle contact</p>
          <p className="mt-4 text-3xl leading-tight font-semibold tracking-tight">
            Connect with the owner without sharing personal information.
          </p>
          <ul className="mt-10 space-y-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-[0.9375rem] text-white/75">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/8 ring-1 ring-white/10">
                  <Icon className="size-4.5 text-white" strokeWidth={1.75} aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-white/40">Free to join · No app required · Private messaging</p>
      </aside>

      <main className="flex flex-col items-center justify-center px-4 py-10 sm:px-6">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="surface mt-8 w-full max-w-sm p-6 shadow-raised sm:p-8 lg:mt-0">{children}</div>
        <p className="meta mt-6 text-center lg:hidden">Free to join · No app required · Private messaging</p>
        <Link href="/" className="meta mt-4 rounded-sm underline-offset-4 hover:text-foreground hover:underline">
          ← Back to home
        </Link>
      </main>
    </div>
  );
}
