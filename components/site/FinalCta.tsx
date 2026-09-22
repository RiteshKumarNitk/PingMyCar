import Link from "next/link";
import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Make your vehicle easier to reach.
        </h2>
        <p className="mt-3 text-xl text-muted-foreground">Without giving away your number.</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-12 px-8 text-base">
            <Link href="/signup">Get Your Free QR</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base">
            <Link href="/how-it-works">See How It Works</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
