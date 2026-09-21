import Link from "next/link";
import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section className="px-4 pb-20 sm:px-6">
      <div className="mx-auto max-w-4xl rounded-3xl bg-[#16222c] px-6 py-14 text-center text-slate-100 sm:px-12">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Make your vehicle easier to reach.
        </h2>
        <p className="mt-3 text-lg text-slate-300">
          Without giving away your number.
        </p>
        <Button asChild size="lg" className="mt-8 h-12 px-8 text-base">
          <Link href="/signup">Get Your QR</Link>
        </Button>
      </div>
    </section>
  );
}
