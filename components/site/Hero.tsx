import Link from "next/link";
import {
  ArrowDown,
  Bell,
  Car,
  MessageSquareText,
  QrCode,
  ScanLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const flow = [
  { icon: Car, label: "Your vehicle" },
  { icon: QrCode, label: "QR sticker" },
  { icon: ScanLine, label: "Someone scans" },
  { icon: MessageSquareText, label: "“Your lights are on”" },
  { icon: Bell, label: "You get notified" },
];

export function Hero() {
  return (
    <section className="px-4 sm:px-6">
      <div className="mx-auto grid max-w-6xl items-center gap-14 py-16 sm:py-24 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <h1 className="max-w-xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
            Someone needs to reach you about your car —{" "}
            <span className="text-primary">not your number.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            A private QR sticker for your vehicle. Anyone who scans it can
            message you about parking, lights left on, or damage — instantly,
            with no app to download and no phone number shown.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-7 text-base">
              <Link href="/signup">Get Your QR</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 px-7 text-base"
            >
              <Link href="/#how-it-works">See How It Works</Link>
            </Button>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">
            No app needed for anyone contacting you. Setup takes about a
            minute.
          </p>
        </div>

        {/* Flow diagram: the concept, understood without reading */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            How a message reaches you
          </p>
          <ol className="mt-5 space-y-0">
            {flow.map(({ icon: Icon, label }, i) => (
              <li key={label}>
                {i > 0 && (
                  <div className="flex justify-center py-1" aria-hidden>
                    <ArrowDown className="h-4 w-4 text-muted-foreground/70" />
                  </div>
                )}
                <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-sm font-medium">{label}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
