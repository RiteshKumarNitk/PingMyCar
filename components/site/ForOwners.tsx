import { ShieldCheck, Timer, Car, BadgeDollarSign, Smartphone, SlidersHorizontal } from "lucide-react";

const BENEFITS = [
  {
    icon: ShieldCheck,
    title: "Privacy",
    text: "Keep your personal contact information private.",
  },
  {
    icon: Timer,
    title: "Easy",
    text: "Set up your vehicle in minutes.",
  },
  {
    icon: Car,
    title: "Vehicle-specific",
    text: "Every vehicle gets its own QR.",
  },
  {
    icon: BadgeDollarSign,
    title: "Free",
    text: "Create your account and get started without a subscription.",
  },
  {
    icon: Smartphone,
    title: "No app for visitors",
    text: "People can contact your vehicle directly from their browser.",
  },
  {
    icon: SlidersHorizontal,
    title: "Control",
    text: "Deactivate or regenerate your QR whenever necessary.",
  },
];

export function ForOwners() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">For owners</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Built for vehicle owners.
          </h2>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
