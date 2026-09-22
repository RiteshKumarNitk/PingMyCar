import Link from "next/link";
import { BellRing, Car, Check, MessageSquareText, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { qrSvgMarkup } from "@/lib/qr";

export function Hero() {
  const demoQr = qrSvgMarkup("https://pingmycar.app/v/EXAMPLE1", 5);

  return (
    <section className="relative overflow-hidden">
      {/* Subtle top tint — one soft wash, no heavy gradients */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-primary/[0.04]" aria-hidden />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-24 lg:pt-20">
        <div>
          <p className="eyebrow">Private vehicle contact</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
            Someone needs to reach you about your car.
            <span className="block text-primary">They shouldn&apos;t need your phone number.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Put a private PingMyCar QR sticker on your vehicle. Anyone who scans it can
            send you a message about your car — without seeing your phone number or
            needing an app.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-7 text-base">
              <Link href="/signup">Get Your Free QR</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-7 text-base">
              <Link href="/how-it-works">See How It Works</Link>
            </Button>
          </div>

          <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {["Free to join", "No app required", "Private messaging", "One QR per vehicle"].map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-primary" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Product visual: sticker → scan → private message → owner notified */}
        <div className="relative mx-auto w-full max-w-md">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xl shadow-navy/5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                How it works
              </p>
              <span className="flex items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-1 text-xs font-medium text-success">
                <BellRing className="h-3.5 w-3.5" aria-hidden />
                Owner notified
              </span>
            </div>

            <ol className="mt-5 space-y-4">
              <li className="flex items-center gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                  <Car className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-3">
                  <p className="text-sm font-semibold">Your vehicle</p>
                  <p className="text-xs text-muted-foreground">A QR sticker on the rear window</p>
                </div>
              </li>

              <li className="flex items-center gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                  <ScanLine className="h-5 w-5" aria-hidden />
                </span>
                <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
                  <span
                    className="h-9 w-9 shrink-0 overflow-hidden rounded-md border border-border bg-white"
                    aria-hidden
                    dangerouslySetInnerHTML={{ __html: demoQr }}
                  />
                  <div>
                    <p className="text-sm font-semibold">Someone scans it</p>
                    <p className="text-xs text-muted-foreground">Any phone camera — no app</p>
                  </div>
                </div>
              </li>

              <li className="flex items-center gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                  <MessageSquareText className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    &ldquo;Your headlights are still on.&rdquo;
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Sent privately through PingMyCar</p>
                </div>
              </li>
            </ol>

            <p className="mt-5 border-t border-border pt-4 text-center text-xs text-muted-foreground">
              🔒 Your phone number and email are not shared with the person contacting your vehicle.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
