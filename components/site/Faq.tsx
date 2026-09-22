import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "Do people need the app to contact me?",
    a: "No. They can scan your QR and use the mobile website — no installation, no account.",
  },
  {
    q: "Will they see my phone number?",
    a: "No. Messages are delivered through the platform. Your phone number and email are never shown.",
  },
  {
    q: "Do I need an app?",
    a: "The initial version works through the web. A mobile app can be used for owner notifications and messaging.",
  },
  {
    q: "Can I deactivate my QR?",
    a: "Yes. Vehicle owners can deactivate their QR at any time. Scanning a deactivated sticker shows an inactive notice.",
  },
  {
    q: "Can I use one account for multiple vehicles?",
    a: "Yes — the system is designed to support multiple vehicles, each with its own QR code.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="text-center">
          <p className="eyebrow">FAQ</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Questions, answered.
          </h2>
        </div>

        <div className="mt-10 space-y-3">
          {FAQS.map(({ q, a }) => (
            <details
              key={q}
              className="group rounded-xl border border-border bg-card px-5 py-4 open:shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                {q}
                <ChevronDown
                  className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          More questions?{" "}
          <a href="/faq" className="font-medium text-primary underline-offset-4 hover:underline">
            See the full FAQ
          </a>
        </p>
      </div>
    </section>
  );
}
