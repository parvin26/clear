"use client";

const pillars = [
  { title: "Diagnose", description: "Identify the real problem, not symptoms.", highlight: true },
  { title: "Translate", description: "Convert problems into the capabilities your business must build.", highlight: false },
  { title: "Activate", description: "Build capability using playbooks and structured support.", highlight: false },
];

export function DifferentiationSection() {
  return (
    <section id="why-clear" className="py-16 md:py-20">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="text-center mb-14">
          <h2 className="text-2xl md:text-3xl font-semibold text-ink">
            Built different. Built for capability.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {pillars.map((pillar, index) => (
            <div key={index} className="text-center space-y-4">
              <div
                className={`w-12 h-12 rounded-full border-2 border-primary text-primary mx-auto flex items-center justify-center text-lg font-bold ${
                  pillar.highlight ? "bg-accent/20 border-accent text-ink" : "bg-primary-soft"
                }`}
              >
                {index + 1}
              </div>
              <h3 className="font-semibold text-lg text-ink">{pillar.title}</h3>
              <p className="text-ink-muted leading-relaxed max-w-xs mx-auto">{pillar.description}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <p className="text-ink-muted font-medium max-w-md mx-auto">
            CLEAR is designed to exit once capability is internalised.
          </p>
        </div>
      </div>
    </section>
  );
}
