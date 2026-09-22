import { Lock } from "lucide-react";

export function TrustStatement() {
  return (
    <section className="border-y border-border bg-accent/50">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 px-4 py-8 text-center sm:px-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Lock className="h-5 w-5" aria-hidden />
        </span>
        <p className="text-lg font-semibold">Your number stays private.</p>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Messages are delivered through our platform. Your personal contact information
          is never shown to the person contacting your vehicle.
        </p>
      </div>
    </section>
  );
}
