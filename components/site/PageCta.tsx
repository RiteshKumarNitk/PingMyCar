import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PageCta({
  title = "Make your vehicle easier to reach.",
  subtitle = "Without giving away your number.",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-2 text-lg text-muted-foreground">{subtitle}</p>}
        <div className="mt-6">
          <Button asChild size="lg">
            <Link href="/signup">Get Your Free QR</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
