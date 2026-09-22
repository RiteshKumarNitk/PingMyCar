import type { Metadata } from "next";
import Link from "next/link";
import { PageCta } from "@/components/site/PageCta";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What PingMyCar collects, why, and how your information is protected.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border py-8 last:border-b-0">
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <>
      <section className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <p className="eyebrow">Legal</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: September 2026</p>

        <div className="mt-6">
          <Section title="What we collect">
            <p>
              <strong className="text-foreground">Owner accounts:</strong> your name (as you
              enter it), email address if you add one, and phone number for login codes.
              Google sign-in provides your name, email, and profile photo if you use it.
            </p>
            <p>
              <strong className="text-foreground">Vehicles:</strong> the details you add —
              nickname, type, optional registration number and photo. The registration
              number is private unless you turn on visibility for it.
            </p>
            <p>
              <strong className="text-foreground">Messages:</strong> the content visitors
              send about your vehicles and your replies, stored to run the conversation.
            </p>
            <p>
              <strong className="text-foreground">Technical data:</strong> rate-limiting uses
              a one-way hash of visitor IP addresses — raw IPs are not stored. Push
              subscription endpoints are stored if you enable browser notifications.
            </p>
          </Section>

          <Section title="What visitors leave behind">
            <p>
              Visitors don&apos;t create accounts and aren&apos;t asked for a phone number or
              email. A message conversation is reachable only through a secret link that
              isn&apos;t tied to their identity. We store a one-way hashed IP for abuse
              prevention.
            </p>
          </Section>

          <Section title="What is never shown to visitors">
            <p>
              Your phone number and email are not shared with the person contacting your
              vehicle. Owner identity fields (name, photo, preferred name) and vehicle
              fields (registration number, photo) appear on a vehicle&apos;s public page
              only when you explicitly enable each one. Internal database IDs are never
              exposed in public URLs.
            </p>
          </Section>

          <Section title="How your data is used">
            <p>
              To deliver messages between visitors and owners, send notifications you&apos;ve
              enabled, prevent abuse and rate-limit spam, and support the account features
              you use. We don&apos;t sell personal information or use message content for
              advertising.
            </p>
          </Section>

          <Section title="Your controls">
            <p>
              You can edit or hide any visible field, deactivate or regenerate a QR at any
              time, block conversations, and delete vehicles (which deletes their
              conversations). Deleting your account removes your data associated with it.
              For any request, contact{" "}
              <a href="mailto:support@pingmycar.app" className="font-medium text-primary underline-offset-4 hover:underline">
                support@pingmycar.app
              </a>
              .
            </p>
          </Section>

          <Section title="Cookies">
            <p>
              We use a session cookie to keep you logged in — nothing more. See our{" "}
              <Link href="/privacy" className="font-medium text-primary underline-offset-4 hover:underline">
                Privacy
              </Link>{" "}
              page for the product-level overview.
            </p>
          </Section>
        </div>
      </section>

      <PageCta title="Questions about your data?" subtitle="We're happy to walk you through it." />
    </>
  );
}
