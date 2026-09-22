export function SolutionSection() {
  const steps = ["Create", "Get your QR", "Stick it on your car", "Someone scans", "Message you"];

  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:py-20">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Give your vehicle its own private contact channel.
        </h2>

        <div className="mx-auto mt-10 flex max-w-xl flex-col items-center gap-1">
          {steps.map((step, i) => (
            <div key={step} className="contents">
              <span className="flow-chain w-full rounded-lg border border-border bg-card px-6 py-3 text-foreground shadow-sm">
                {step}
              </span>
              {i < steps.length - 1 && (
                <span aria-hidden className="py-0.5 text-lg font-light text-primary">
                  ↓
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
