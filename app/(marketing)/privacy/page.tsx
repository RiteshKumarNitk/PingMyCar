import Link from "next/link";
import type { Metadata } from "next";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageCta } from "@/components/site/PageCta";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How PingMyCar protects owner contact information: what visitors can do, what they never need, and what owners control.",
};

const VISITOR_CAN = ["Scan the QR", "View the vehicle contact page", "Send a message"];
const VISITOR_NEED_NOT = ["A PingMyCar account", "The app", "A phone number", "An email address"];
const OWNER_CONTROLS = [
  "Vehicle details",
  "QR status (active / inactive)",
  "QR regeneration",
  "QR deactivation",
  "Notification preferences",
];

function FlowNode({ label, sub, accent = false }: { label: string; sub: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-xl border px-5 py-4 text-center ${
        accent ? "border-primary/40 bg-primary/5" : "border-border bg-card"
      }`}
    >
      <p className="font-semibold">{label}</p>
      <p className="text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <section className="border-b border-border bg-muted/40">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <p className="eyebrow">Privacy</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Your vehicle can be reachable without exposing you.
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="text-base">What visitors can do</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {VISITOR_CAN.map((item) => (
                <p key={item} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 shrink-0 text-success" aria-hidden />
                  {item}
                </p>
              ))}
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="text-base">What visitors don&apos;t need</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {VISITOR_NEED_NOT.map((item) => (
                <p key={item} className="flex items-center gap-2 text-sm">
                  <X className="h-4 w-4 shrink-0 text-danger" aria-hidden />
                  {item}
                </p>
              ))}
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="text-base">What owners control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {OWNER_CONTROLS.map((item) => (
                <p key={item} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 shrink-0 text-success" aria-hidden />
                  {item}
                </p>
              ))}
            </CardContent>
          </Card>
        </div>

        <h2 className="mt-16 text-center text-2xl font-bold tracking-tight">
          Where your information flows
        </h2>
        <div className="mx-auto mt-8 max-w-xl space-y-1">
          <FlowNode label="Visitor" sub="Scans the sticker" />
          <p aria-hidden className="text-center text-lg font-light text-primary">↓</p>
          <FlowNode label="Vehicle QR" sub="A code that identifies the vehicle, not you" />
          <p aria-hidden className="text-center text-lg font-light text-primary">↓</p>
          <FlowNode label="PingMyCar" sub="Relays the message" accent />
          <p aria-hidden className="text-center text-lg font-light text-primary">↓</p>
          <FlowNode label="Private message" sub="Delivered with no contact details attached" />
          <p aria-hidden className="text-center text-lg font-light text-primary">↓</p>
          <FlowNode label="Owner dashboard" sub="You read and reply in private" />
        </div>

        <p className="mx-auto mt-12 max-w-2xl text-center text-sm text-muted-foreground">
          The QR code encodes only a random vehicle address on this site — never a phone
          number, email, owner ID, or registration number. Your phone number and email are
          not shared with the person contacting your vehicle. Details in the{" "}
          <Link href="/privacy-policy" className="font-medium text-primary underline-offset-4 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </section>

      <PageCta />
    </>
  );
}
