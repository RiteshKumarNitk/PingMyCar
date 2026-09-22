import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { ForOwners, Faq } from "@/components/site/sections";
import { PageCta } from "@/components/site/PageCta";

export const metadata: Metadata = {
  title: "For Owners",
  description:
    "Your car can have its own private contact channel. Join free, add your vehicle, print your QR sticker, and start receiving messages.",
};

const STEPS = [
  { title: "Create your free account", text: "Phone number or Google — under a minute." },
  { title: "Add your vehicle", text: "A nickname is enough; details are optional." },
  { title: "Generate your unique QR", text: "One code per vehicle, generated instantly." },
  { title: "Get your sticker", text: "Download the print-ready sticker design from your dashboard." },
  { title: "Place it somewhere visible", text: "Rear window, side glass, or bumper — anywhere scannable." },
  { title: "Start receiving messages", text: "You'll be notified by browser push and email." },
];

export default function ForOwnersPage() {
  return (
    <>
      <section className="border-b border-border bg-muted/40">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <p className="eyebrow">For vehicle owners</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Your car can have its own private contact channel.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Join free, add your vehicle, print your QR sticker, and let people reach you
            about your car — not about your phone number.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">Get Your Free QR</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/stickers">See Sticker Options</Link>
            </Button>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight">
            How joining works
          </h2>
          <ol className="mt-10 space-y-4">
            {STEPS.map(({ title, text }, i) => (
              <li key={title} className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-sm font-semibold text-primary">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <ForOwners />
      <Faq />
      <PageCta />
    </>
  );
}
