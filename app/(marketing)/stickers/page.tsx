import Link from "next/link";
import type { Metadata } from "next";
import { Download, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StickerSvg } from "@/components/qr/StickerSvg";
import { PageCta } from "@/components/site/PageCta";

export const metadata: Metadata = {
  title: "Stickers",
  description:
    "PingMyCar sticker formats for your vehicle — and how to download and print your QR sticker yourself.",
};

const FORMATS = [
  {
    title: "Square sticker",
    description:
      "The full PingMyCar design with headline, QR, and privacy note — best on glass.",
    size: "36 × 56 mm",
  },
  {
    title: "Bumper sticker",
    description: "Compact wide format, highly visible, fits a bumper or tailgate.",
    size: "140 × 55 mm",
  },
  {
    title: "Window decal",
    description: "Minimal design for vehicle glass — QR-forward, low key.",
    size: "50 × 50 mm",
  },
  {
    title: "Print your own",
    description:
      "Download your QR and print it yourself — any printer, any size you need.",
    size: "Any size",
  },
];

export default function StickersPage() {
  return (
    <>
      <section className="border-b border-border bg-muted/40">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <p className="eyebrow">Stickers</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Put your PingMyCar QR where people can see it.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Every vehicle&apos;s dashboard includes print-ready sticker files — download,
            print, and place.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold tracking-tight">Formats</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FORMATS.map(({ title, description, size }) => (
            <Card key={title} className="rounded-xl">
              <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Suggested size · {size}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 grid items-center gap-10 lg:grid-cols-2">
          <div className="flex flex-wrap items-start justify-center gap-6 rounded-2xl border border-border bg-muted/40 p-8">
            <StickerSvg publicUrl="https://pingmycar.app/v/EXAMPLE1" className="w-44 max-w-none" />
            <StickerSvg
              publicUrl="https://pingmycar.app/v/EXAMPLE1"
              variant="wide"
              className="w-full max-w-md"
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Download and print your QR yourself.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Physical sticker ordering isn&apos;t available yet — so your dashboard gives
              you print-ready files instead. Each sticker uses the same consistent design:
              <span className="font-medium text-foreground">
                {" "}
                NEED TO CONTACT THIS VEHICLE?
              </span>{" "}
              above a large scannable QR, <span className="font-medium text-foreground">SCAN HERE</span>,
              and the reassurance that the owner&apos;s contact info stays private.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Download className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                Download as SVG for crisp printing at any size
              </li>
              <li className="flex items-start gap-2">
                <Download className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                Or print the sticker sheet directly from the QR page
              </li>
            </ul>
            <div className="mt-6 flex items-start gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              Follow local vehicle and road-safety regulations when placing stickers.
            </div>
            <Button asChild className="mt-6">
              <Link href="/signup">Get Your Free QR</Link>
            </Button>
          </div>
        </div>
      </section>

      <PageCta />
    </>
  );
}
