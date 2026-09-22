import type { Metadata } from "next";
import { PageCta } from "@/components/site/PageCta";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply when you use PingMyCar.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border py-8 last:border-b-0">
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <>
      <section className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <p className="eyebrow">Legal</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight">Terms of Service</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: September 2026</p>

        <div className="mt-6">
          <Section title="The service">
            <p>
              PingMyCar provides a QR-based contact channel for vehicles. Visitors send
              messages to vehicle owners through the platform; owners manage their
              vehicles, QR codes, and conversations. The service is currently free.
            </p>
          </Section>

          <Section title="Your account">
            <p>
              Keep your credentials safe and use your own contact details. You&apos;re
              responsible for the vehicles you register and the content you send. One
              person or entity per account; vehicles you register should be vehicles you
              own or manage.
            </p>
          </Section>

          <Section title="Acceptable use">
            <p>
              Don&apos;t use PingMyCar to harass, threaten, spam, or impersonate anyone;
              don&apos;t register vehicles you have no relationship with; don&apos;t
              interfere with the service or other users. We may rate-limit, block, or
              remove accounts that abuse the service.
            </p>
          </Section>

          <Section title="Not for emergencies">
            <p>
              PingMyCar is not an emergency service and makes no guarantee of delivery
              time. For emergencies, always contact your local emergency service.
            </p>
          </Section>

          <Section title="Sticker placement">
            <p>
              You&apos;re responsible for placing stickers in line with local vehicle and
              road-safety regulations in your area.
            </p>
          </Section>

          <Section title="Availability and changes">
            <p>
              We work to keep the service available, but it&apos;s provided &ldquo;as
              is&rdquo; without warranties. Features and pricing may change; material
              changes to these terms will be communicated before they take effect.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions about these terms:{" "}
              <a href="mailto:support@pingmycar.app" className="font-medium text-primary underline-offset-4 hover:underline">
                support@pingmycar.app
              </a>
              .
            </p>
          </Section>
        </div>
      </section>

      <PageCta title="Ready to try it?" subtitle="Set up your first vehicle in minutes." />
    </>
  );
}
