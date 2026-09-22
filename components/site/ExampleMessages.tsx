import { Lightbulb, CarFront, TriangleAlert, MessageCircle, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const MESSAGES = [
  { icon: Lightbulb, text: "Your headlights are still on." },
  { icon: CarFront, text: "Your vehicle is blocking the exit." },
  { icon: TriangleAlert, text: "Someone may have hit your vehicle." },
  { icon: MessageCircle, text: "I need to let you know something about your car." },
];

export function ExampleMessages() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">What lands in your inbox</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Real messages from people who spotted your car.
          </h2>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
          {MESSAGES.map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4.5 w-4.5" aria-hidden />
                </span>
                <p className="pt-1 text-foreground/90">&ldquo;{text}&rdquo;</p>
              </div>
              <div className="mt-4">
                <Badge variant="secondary" className="gap-1.5">
                  <Lock className="h-3 w-3" aria-hidden />
                  Sent privately through PingMyCar
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
