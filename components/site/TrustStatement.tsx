import { ShieldCheck } from "lucide-react";

export function TrustStatement() {
  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 px-4 py-10 text-center sm:flex-row sm:px-6 sm:text-left">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
          aria-hidden
        >
          <ShieldCheck className="h-6 w-6" />
        </span>
        <div>
          <p className="font-semibold">Your number stays private.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Messages are delivered through our platform. Your personal contact
            information is never shown to the person contacting your vehicle.
          </p>
        </div>
      </div>
    </section>
  );
}
