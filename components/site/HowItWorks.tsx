import Link from "next/link";
import { UserRoundPlus, CarFront, QrCode, Sticker, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    icon: UserRoundPlus,
    title: "Create your account",
    text: "Create your free PingMyCar account with your phone or Google.",
  },
  {
    icon: CarFront,
    title: "Add your vehicle",
    text: "Add your vehicle details — a nickname is all it takes to start.",
  },
  {
    icon: QrCode,
    title: "Get your QR",
    text: "Generate your vehicle's unique QR code instantly.",
  },
  {
    icon: Sticker,
    title: "Place the sticker",
    text: "Print it or use a PingMyCar sticker and place it somewhere visible.",
  },
  {
    icon: BellRing,
    title: "Receive private messages",
    text: "Someone scans the QR and contacts you through PingMyCar — your number stays yours.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            From signup to your first message in minutes.
          </h2>
        </div>

        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="relative rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="font-mono text-sm font-semibold text-primary/60">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 text-center">
          <Button asChild size="lg">
            <Link href="/signup">Get Your Free QR</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
