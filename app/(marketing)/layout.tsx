import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}
