import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { HowItWorks, VisitorExperience, Privacy } from "@/components/site/sections";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "From signup to your first private message: create an account, add your vehicle, get your QR, place the sticker, receive messages.",
};

export default function HowItWorksPage() {
  return (
    <>
      <section className="border-b border-border bg-muted/40">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <p className="eyebrow">How it works</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Your car, reachable. Your number, private.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Three minutes of setup, then anyone who spots an issue with your vehicle can
            tell you — without ever seeing who you are.
          </p>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href="/signup">Get Your Free QR</Link>
            </Button>
          </div>
        </div>
      </section>

      <HowItWorks />
      <VisitorExperience />
      <Privacy />
      <FinalCtaSection />
    </>
  );
}

function FinalCtaSection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Ready to make your vehicle reachable?
        </h2>
        <div className="mt-6">
          <Button asChild size="lg">
            <Link href="/signup">Get Your Free QR</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
