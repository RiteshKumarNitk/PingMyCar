import type { Metadata } from "next";
import Link from "next/link";
import { PageCta } from "@/components/site/PageCta";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What OwnerPing collects, why, and how your information is protected.",
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
              <strong className="text-foreground">Owner accounts:</strong> owners sign in with
              Google, which provides your name, email address, and profile photo. You can
              edit your name in your profile.
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
            <p>
              <strong className="text-foreground">OwnerPing app notifications:</strong> if you
              use the Android app, we store your device&apos;s push token (Firebase Cloud
              Messaging) with your account so we can alert that device about new messages.
              It is removed when you sign out on that device. Notification text shows the
              contact reason, not the visitor&apos;s message.
            </p>
            <p>
              <strong className="text-foreground">Email alerts:</strong> we email you at your
              Google account address when someone sends a message about your vehicle.
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
              time, block conversations, delete individual conversations, and delete
              vehicles (which deletes their conversations).
            </p>
          </Section>

          <Section title="Deleting your account">
            <p>
              You can delete your account at any time in the OwnerPing app (Profile →
              Account → Delete account) or on the web (Dashboard → Settings → Delete
              account). See{" "}
              <Link href="/delete-account" className="font-medium text-primary underline-offset-4 hover:underline">
                how account deletion works
              </Link>
              .
            </p>
            <p>
              Deletion is immediate and permanent. We delete your account and sign-in link
              with Google, your name, email address and photo, all of your vehicles and
              their QR codes (printed stickers stop working), vehicle photos, conversations
              and messages, and the push tokens of your devices.
            </p>
            <p>
              One exception: if a conversation on your vehicle is under an open abuse
              report, that conversation and its messages are kept until our moderators
              finish the review. In that case the account is kept only as an anonymized,
              disabled record with no name, email, photo or vehicle details, the vehicle&apos;s
              QR is turned off, and no one can sign in to it. A security log records that
              the deletion happened, without your personal details.
            </p>
          </Section>

          <Section title="Service providers">
            <p>
              OwnerPing runs on service providers that process data only to provide the
              service: Vercel (hosting), Neon (database and file storage), Upstash
              (rate limiting), Google (sign-in and Firebase Cloud Messaging push
              notifications) and Resend (email alerts). We don&apos;t sell personal
              information or share it for advertising.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              OwnerPing is developed by{" "}
              <a href="https://innovatex-technology.com/" className="font-medium text-primary underline-offset-4 hover:underline">
                InnovateX Technology
              </a>
              . For any privacy request, contact{" "}
              <a href="mailto:info@innovatex-technology.com" className="font-medium text-primary underline-offset-4 hover:underline">
                info@innovatex-technology.com
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
