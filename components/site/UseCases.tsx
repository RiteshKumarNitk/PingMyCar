import { CarFront, DoorOpen, Eye, MessageCircle } from "lucide-react";

const cases = [
  { icon: Eye, quote: "Your headlights are still on." },
  { icon: DoorOpen, quote: "Your car is blocking the exit." },
  { icon: CarFront, quote: "Someone may have hit your vehicle." },
  { icon: MessageCircle, quote: "I need to let you know something about your car." },
];

export function UseCases() {
  return (
    <section className="border-y border-border bg-card px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          When would someone scan it?
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          The everyday moments when a stranger needs to reach you — and today
          has no way to.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cases.map(({ icon: Icon, quote }) => (
            <figure
              key={quote}
              className="flex flex-col rounded-2xl border border-border bg-background p-5"
            >
              <Icon className="h-5 w-5 text-primary" aria-hidden />
              <blockquote className="mt-3 flex-1 text-sm leading-relaxed">
                &ldquo;{quote}&rdquo;
              </blockquote>
              <figcaption className="mt-4 text-xs text-muted-foreground">
                Sent anonymously through PingMyCar
              </figcaption>
            </figure>
          ))}
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          For emergencies, always contact local emergency services. PingMyCar
          is for everyday vehicle situations.
        </p>
      </div>
    </section>
  );
}
