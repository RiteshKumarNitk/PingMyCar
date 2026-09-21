import { Benefits } from "@/components/site/Benefits";
import { Faq } from "@/components/site/Faq";
import { FinalCta } from "@/components/site/FinalCta";
import { Footer } from "@/components/site/Footer";
import { Hero } from "@/components/site/Hero";
import { HowItWorks } from "@/components/site/HowItWorks";
import { Navbar } from "@/components/site/Navbar";
import { Privacy } from "@/components/site/Privacy";
import { StickerPreview } from "@/components/site/StickerPreview";
import { TrustStatement } from "@/components/site/TrustStatement";
import { UseCases } from "@/components/site/UseCases";

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Do people need the app to contact me?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. They can scan your QR and use the mobile website — no installation, no account.",
      },
    },
    {
      "@type": "Question",
      name: "Will they see my phone number?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Messages are delivered through the platform. Your phone number and email are never shown.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need an app?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The initial version works through the web. A mobile app can be used for owner notifications and messaging.",
      },
    },
    {
      "@type": "Question",
      name: "Can I deactivate my QR?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Vehicle owners can deactivate their QR at any time. Scanning a deactivated sticker shows an inactive notice.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use one account for multiple vehicles?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — the system is designed to support multiple vehicles, each with its own QR code.",
      },
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Navbar />
      <main>
        <Hero />
        <TrustStatement />
        <HowItWorks />
        <UseCases />
        <Privacy />
        <StickerPreview />
        <Benefits />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
