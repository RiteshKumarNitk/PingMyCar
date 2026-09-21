import { Bell, Car, QrCode } from "lucide-react";

const steps = [
  {
    icon: QrCode,
    title: "Create your vehicle QR",
    body: "Add your vehicle and generate your unique QR code.",
  },
  {
    icon: Car,
    title: "Place it on your vehicle",
    body: "Print the QR sticker and place it somewhere visible.",
  },
  {
    icon: Bell,
    title: "Receive private messages",
    body: "Someone scans the QR and sends you a message. You receive it without revealing your phone number.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          How it works
        </h2>
        <p
          className="mt-3 font-mono text-xs tracking-[0.3em] text-muted-foreground"
          aria-hidden
        >
          CREATE&nbsp;&nbsp;↓&nbsp;&nbsp;STICK&nbsp;&nbsp;↓&nbsp;&nbsp;CONNECT
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, body }, i) => (
            <div key={title} className="relative rounded-2xl border border-border bg-card p-6">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
                aria-hidden
              >
                {i + 1}
              </span>
              <Icon className="absolute right-6 top-6 h-5 w-5 text-muted-foreground/60" aria-hidden />
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
