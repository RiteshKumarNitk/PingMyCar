import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3100";
const title = "PingMyCar — Contact a Vehicle Owner Privately";
const description =
  "Put a private QR sticker on your vehicle and let people contact you without revealing your phone number.";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: title,
    template: "%s — PingMyCar",
  },
  description,
  openGraph: {
    type: "website",
    url: appUrl,
    siteName: "PingMyCar",
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#16222c",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
