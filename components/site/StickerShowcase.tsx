import { StickerSvg } from "@/components/qr/StickerSvg";

function PlacementCard({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex h-52 items-center justify-center bg-muted/50 p-6">{children}</div>
      <div className="border-t border-border px-5 py-4">
        <p className="font-semibold">{label}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

/** Stylized glass/backdrop panels the stickers sit on. */
function Glass({ tint = "dark" }: { tint?: "dark" | "light" }) {
  return (
    <div
      aria-hidden
      className="absolute inset-0 rounded-2xl border border-white/10 shadow-inner"
      style={{
        background:
          tint === "dark"
            ? "linear-gradient(135deg, #1b2836 0%, #3a4a5c 55%, #55677c 100%)"
            : "linear-gradient(135deg, #b9c6d4 0%, #dfe7ee 60%, #f2f6fa 100%)",
      }}
    />
  );
}

export function StickerShowcase() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">The sticker</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            One sticker. One private contact channel.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Your QR is designed to be scanned at arm&apos;s length — big, high-contrast,
            and readable from a reasonable distance.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <PlacementCard label="Rear windshield" hint="Classic spot — visible to anyone behind you.">
            <div className="relative flex h-full w-full items-center justify-center">
              <Glass />
              <StickerSvg
                publicUrl="https://pingmycar.app/v/EXAMPLE1"
                className="relative w-28 max-w-none"
              />
            </div>
          </PlacementCard>

          <PlacementCard label="Side window" hint="Easy to scan from the next parking space.">
            <div className="relative flex h-full w-full items-center justify-center">
              <Glass tint="light" />
              <StickerSvg
                publicUrl="https://pingmycar.app/v/EXAMPLE1"
                variant="round"
                className="relative w-28 max-w-none"
              />
            </div>
          </PlacementCard>

          <PlacementCard label="Bumper" hint="The wide format fits a bumper perfectly.">
            <div className="relative flex h-full w-full items-center justify-center">
              <Glass />
              <StickerSvg
                publicUrl="https://pingmycar.app/v/EXAMPLE1"
                variant="wide"
                className="relative w-56 max-w-none"
              />
            </div>
          </PlacementCard>
        </div>
      </div>
    </section>
  );
}
