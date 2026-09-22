import { Check, EyeOff, ScanLine, ShieldCheck } from "lucide-react";

const GUARANTEES = [
  "Visitor does not see owner phone number",
  "Visitor does not see owner email",
  "Visitor does not need an account",
  "Owner receives the message",
];

export function Privacy() {
  return (
    <section id="privacy" className="bg-navy-2 text-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow" style={{ color: "#7ea6f8" }}>
            Privacy by design
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Contact the vehicle. Not the person.
          </h2>
        </div>

        <div className="mx-auto mt-14 max-w-4xl space-y-1">
          {/* Visitor */}
          <div className="flex items-center gap-5 rounded-xl border border-white/10 bg-white/5 p-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <EyeOff className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <p className="font-semibold">Visitor</p>
              <p className="text-sm text-slate-400">Scans the sticker, picks a reason, sends a message.</p>
            </div>
          </div>

          <p aria-hidden className="py-1 text-center text-xl font-light" style={{ color: "#7ea6f8" }}>
            ↓
          </p>
          <p aria-hidden className="flow-chain text-center text-[10px] text-slate-400">QR scan</p>

          {/* PingMyCar */}
          <div className="flex items-center gap-5 rounded-xl border border-primary/30 bg-primary/10 p-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
              <ScanLine className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <p className="font-semibold">PingMyCar</p>
              <p className="text-sm text-slate-300">
                Delivers the message through the platform — contact details never leave the owner&apos;s account.
              </p>
            </div>
          </div>

          <p aria-hidden className="py-1 text-center text-xl font-light" style={{ color: "#7ea6f8" }}>
            ↓
          </p>
          <p aria-hidden className="flow-chain text-center text-[10px] text-slate-400">Private message</p>

          {/* Owner */}
          <div className="flex items-center gap-5 rounded-xl border border-white/10 bg-white/5 p-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <ShieldCheck className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <p className="font-semibold">Vehicle owner</p>
              <p className="text-sm text-slate-400">Reads and replies from the private dashboard.</p>
            </div>
          </div>
        </div>

        <ul className="mx-auto mt-12 grid max-w-3xl gap-3 sm:grid-cols-2">
          {GUARANTEES.map((item) => (
            <li key={item} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm">
              <Check className="h-4 w-4 shrink-0" style={{ color: "#7ea6f8" }} aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
