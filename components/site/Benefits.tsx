import { Car, Lock, MessageSquareText, Smartphone } from "lucide-react";

const benefits = [
  {
    icon: Lock,
    title: "Privacy",
    body: "Keep your phone number private.",
  },
  {
    icon: Smartphone,
    title: "Easy",
    body: "No app required for people contacting you.",
  },
  {
    icon: Car,
    title: "Vehicle-specific",
    body: "Each vehicle gets its own QR.",
  },
  {
    icon: MessageSquareText,
    title: "Direct",
    body: "Receive messages about your vehicle.",
  },
];

export function Benefits() {
  return (
    <section className="border-y border-border bg-card px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Built for owners
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border bg-background p-6">
              <Icon className="h-6 w-6 text-primary" aria-hidden />
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
