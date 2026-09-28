import { Logo } from "@/components/shared/Logo";
import { ErrorState } from "@/components/shared/ErrorState";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4">
      <Logo />
      <ErrorState
        kind={404}
        title="Page not found"
        description="If you scanned a QR sticker, double-check the code — the sticker may be inactive or outdated."
        primary={{ label: "Go Home", href: "/" }}
        secondary={{ label: "Contact Support", href: "/contact" }}
      />
    </div>
  );
}
