import { Lightbulb, CarFront, TriangleAlert, MessageCircle, MoveRight } from "lucide-react";

const SITUATIONS = [
  { icon: Lightbulb, text: "Your headlights are still on." },
  { icon: CarFront, text: "Your vehicle is blocking an exit." },
  { icon: TriangleAlert, text: "Someone noticed possible damage." },
  { icon: MoveRight, text: "Someone needs you to move your vehicle." },
  { icon: MessageCircle, text: "Someone simply needs to tell you something." },
];

export function ProblemSection() {
  return (
    <section className="border-y border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Your car can be somewhere you aren&apos;t.
          </h2>
        </div>

        <ul className="mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SITUATIONS.map(({ icon: Icon, text }) => (
            <li
              key={text}
              className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3.5"
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <span className="text-sm text-foreground/90">{text}</span>
            </li>
          ))}
          <li className="flex items-center justify-center rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3.5 text-center text-sm font-semibold text-primary">
            Someone wants to help — but how do they reach you?
          </li>
        </ul>

        <p className="mx-auto mt-10 max-w-xl text-center text-lg text-muted-foreground">
          They can&apos;t call you — they don&apos;t know your number. They can&apos;t
          knock — you&apos;re not there.{" "}
          <span className="font-semibold text-foreground">
            But they can scan a small QR sticker on your vehicle and send you a private
            message.
          </span>
        </p>
      </div>
    </section>
  );
}
