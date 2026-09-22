import { Smartphone } from "lucide-react";

const CHAIN = ["Scan", "Contact vehicle", "Choose message", "Send", "Owner notified"];

export function VisitorExperience() {
  return (
    <section className="relative overflow-hidden bg-navy text-white">
      {/* Faint QR-module texture — nods at the product without decoration for its own sake */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            "radial-gradient(circle 7px at 12px 12px, white 6.5px, transparent 7px)",
          backgroundSize: "36px 36px",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary" style={{ color: "#7ea6f8" }}>
            For your visitors
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            No app. No account. No phone number.
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            If someone sees your PingMyCar sticker, they can scan it with their phone
            camera and send you a message directly from their browser.
          </p>
        </div>

        <div className="mx-auto mt-12 flex max-w-3xl flex-col items-center gap-1">
          {CHAIN.map((step, i) => (
            <div key={step} className="contents">
              <span className="flow-chain w-full rounded-lg border border-white/15 bg-white/5 px-6 py-3 text-white shadow-sm">
                {step}
              </span>
              {i < CHAIN.length - 1 && (
                <span aria-hidden className="py-0.5 text-lg font-light" style={{ color: "#7ea6f8" }}>
                  ↓
                </span>
              )}
            </div>
          ))}
        </div>

        <p className="mx-auto mt-10 flex max-w-md items-center justify-center gap-2 text-center text-sm text-slate-400">
          <Smartphone className="h-4 w-4 shrink-0" aria-hidden />
          Works on any phone with a camera — nothing to install.
        </p>
      </div>
    </section>
  );
}
