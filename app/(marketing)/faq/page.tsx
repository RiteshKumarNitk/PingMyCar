import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { PageCta } from "@/components/site/PageCta";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about PingMyCar — accounts, privacy, QR management, and misuse.",
};

const GROUPS = [
  {
    heading: "The service",
    items: [
      {
        q: "Is PingMyCar free?",
        a: "Yes — PingMyCar is currently free. Create an account, add your vehicles, and get your QR stickers at no cost. If paid plans are ever introduced, existing core features will be announced clearly first.",
      },
      {
        q: "Is PingMyCar for emergencies?",
        a: "No. PingMyCar is for everyday vehicle situations — a flat battery, a blocked exit, possible damage. For emergencies or situations requiring immediate assistance, contact the appropriate local emergency service.",
      },
      {
        q: "What happens when someone scans my QR?",
        a: "They land on your vehicle's contact page: it shows what you've chosen to make visible, offers message reasons you allow, and lets them send you a private message. You get notified, and you reply from your dashboard.",
      },
    ],
  },
  {
    heading: "Privacy",
    items: [
      {
        q: "Does the visitor need the app?",
        a: "No.",
      },
      {
        q: "Does the visitor need an account?",
        a: "No.",
      },
      {
        q: "Will visitors see my phone number?",
        a: "No.",
      },
      {
        q: "Will visitors see my email?",
        a: "No.",
      },
      {
        q: "What do visitors actually see?",
        a: "Only what you explicitly allow on the vehicle's contact profile: optionally the vehicle name, type, photo, registration number, and optionally your display name or preferred name. Nothing else from your account is ever exposed.",
      },
    ],
  },
  {
    heading: "Vehicles and QR codes",
    items: [
      {
        q: "Can I add multiple vehicles?",
        a: "Yes, according to the account's supported vehicle limits. Each vehicle gets its own QR code and its own message inbox.",
      },
      {
        q: "Can I deactivate my QR?",
        a: "Yes. Deactivating stops new conversations instantly — anyone scanning sees a notice that the QR is inactive. Reactivate any time.",
      },
      {
        q: "Can I regenerate my QR?",
        a: "Yes. Regenerating invalidates the old code — the previous sticker stops working and new messages arrive only via the new QR. Useful if a sticker is damaged or you're selling the vehicle.",
      },
    ],
  },
  {
    heading: "Safety and misuse",
    items: [
      {
        q: "Can someone misuse my QR?",
        a: "We've built layered protections: rate limits on anonymous messages, message length limits, and reporting — visitors can report a conversation and you can block any conversation. Abusive senders lose the ability to reach you through that conversation. If you receive threatening messages, contact your local emergency service and report the conversation so it's flagged for moderation.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <section className="border-b border-border bg-muted/40">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <p className="eyebrow">FAQ</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Frequently asked questions
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        {GROUPS.map((group) => (
          <div key={group.heading} className="mb-10">
            <h2 className="text-lg font-bold tracking-tight">{group.heading}</h2>
            <div className="mt-4 space-y-3">
              {group.items.map(({ q, a }) => (
                <details
                  key={q}
                  className="group rounded-xl border border-border bg-card px-5 py-4"
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
          </div>
        ))}

        <p className="text-center text-sm text-muted-foreground">
          Still stuck?{" "}
          <Link href="/contact" className="font-medium text-primary underline-offset-4 hover:underline">
            Contact support
          </Link>
          .
        </p>
      </section>

      <PageCta />
    </>
  );
}
