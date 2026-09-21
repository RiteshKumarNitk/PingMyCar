const faqs = [
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
    <section id="faq" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Frequently asked questions
        </h2>

        <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-card">
          {faqs.map(({ q, a }) => (
            <details key={q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-medium [&::-webkit-details-marker]:hidden">
                {q}
                <span
                  className="text-muted-foreground transition-transform group-open:rotate-45"
                  aria-hidden
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
