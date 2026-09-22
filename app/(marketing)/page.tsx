import { Hero } from "@/components/site/Hero";
import { TrustStatement } from "@/components/site/TrustStatement";
import { ProblemSection } from "@/components/site/ProblemSection";
import { SolutionSection } from "@/components/site/SolutionSection";
import { HowItWorks } from "@/components/site/HowItWorks";
import { VisitorExperience } from "@/components/site/VisitorExperience";
import { ExampleMessages } from "@/components/site/ExampleMessages";
import { Privacy } from "@/components/site/Privacy";
import { ForOwners } from "@/components/site/ForOwners";
import { StickerShowcase } from "@/components/site/StickerShowcase";
import { Faq } from "@/components/site/Faq";
import { FinalCta } from "@/components/site/FinalCta";

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

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Hero />
      <TrustStatement />
      <ProblemSection />
      <SolutionSection />
      <HowItWorks />
      <VisitorExperience />
      <ExampleMessages />
      <Privacy />
      <ForOwners />
      <StickerShowcase />
      <Faq />
      <FinalCta />
    </>
  );
}
