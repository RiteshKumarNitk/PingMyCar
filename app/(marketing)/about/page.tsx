import type { Metadata } from "next";
import { PageCta } from "@/components/site/PageCta";

export const metadata: Metadata = {
  title: "About",
  description: "Why PingMyCar exists — making vehicles easier to reach without making people easier to expose.",
};

export default function AboutPage() {
  return (
    <>
      <section className="border-b border-border bg-muted/40">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <p className="eyebrow">About</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Making vehicles easier to reach without making people easier to expose.
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <div className="space-y-5 text-muted-foreground">
          <p>
            Cars sit in public places, unattended, and things happen to them: headlights
            get left on, parking spots get blocked, doors get scraped. Almost always,
            someone nearby notices and wants to help.
          </p>
          <p>
            But there has never been a good way for that person to reach the owner. Phones
            aren&apos;t listed on windshields — for good reason. So the helpful thing goes
            unsaid, and the owner finds out hours later.
          </p>
          <p>
            PingMyCar is a small fix for that gap: a QR sticker that gives your vehicle a
            contact channel of its own. Messages reach you; your phone number and email
            never leave your account. You decide what&apos;s visible, which message types
            you accept, and when the whole thing goes dark.
          </p>
          <p>
            We keep it simple on purpose. Free to join, no app for visitors, no data
            collection beyond what the product needs, and control where it belongs —
            with the owner.
          </p>
        </div>
      </section>

      <PageCta />
    </>
  );
}
