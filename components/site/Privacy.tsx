import { ArrowDown, MessageSquareText, Smartphone, UserRound } from "lucide-react";

export function Privacy() {
  return (
    <section id="privacy" className="scroll-mt-20 bg-[#16222c] px-4 py-16 text-slate-100 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Contact the vehicle.
          <br />
          <span className="text-sky-400">Not the person.</span>
        </h2>

        <div className="mt-12 grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-6">
            {[
              "Your QR code identifies your vehicle, not your personal information.",
              "Visitors can send messages through a private communication channel.",
              "Your phone number and email stay hidden.",
            ].map((line) => (
              <div key={line} className="flex items-start gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-sky-400" aria-hidden />
                <p className="text-lg leading-relaxed text-slate-300">{line}</p>
              </div>
            ))}
          </div>

          {/* Delivery diagram */}
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/50 p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-slate-300">
                <UserRound className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="font-medium">Visitor</p>
                <p className="text-sm text-slate-400">Scans your sticker</p>
              </div>
            </div>

            <div className="my-4 flex flex-col items-center" aria-hidden>
              <ArrowDown className="h-4 w-4 text-slate-500" />
              <span className="my-1 rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">
                Anonymous message
              </span>
              <ArrowDown className="h-4 w-4 text-slate-500" />
            </div>

            <div className="flex items-center gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-500/20 text-sky-400">
                <MessageSquareText className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="font-medium">PingMyCar</p>
                <p className="text-sm text-slate-400">Relays the message — nothing personal exposed</p>
              </div>
            </div>

            <div className="my-4 flex flex-col items-center" aria-hidden>
              <ArrowDown className="h-4 w-4 text-slate-500" />
              <span className="my-1 rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">
                Private delivery
              </span>
              <ArrowDown className="h-4 w-4 text-slate-500" />
            </div>

            <div className="flex items-center gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-slate-300">
                <Smartphone className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="font-medium">Vehicle owner</p>
                <p className="text-sm text-slate-400">Reads and replies from the dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
