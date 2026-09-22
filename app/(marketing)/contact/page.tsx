import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get help with PingMyCar — email support.",
};

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <div className="text-center">
        <p className="eyebrow">Contact</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight">Need help?</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Questions about your account, your QR, or a message you received — we&apos;re
          here.
        </p>
      </div>

      <Card className="mt-10 rounded-xl text-center">
        <CardHeader>
          <CardTitle className="text-base">Email Support</CardTitle>
          <CardDescription>We aim to reply within one business day.</CardDescription>
        </CardHeader>
        <CardContent>
          <a
            href="mailto:support@pingmycar.app"
            className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-5 py-3 font-medium text-primary transition-colors hover:bg-primary/10"
          >
            <Mail className="h-4 w-4" aria-hidden />
            support@pingmycar.app
          </a>
          <p className="mt-6 text-sm text-muted-foreground">
            A contact form is coming later. In the meantime, email us directly — it lands
            in the same place.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
