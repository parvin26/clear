"use client";

export function EcosystemSection() {
  return (
    <section id="ecosystem" className="py-16 md:py-20 bg-white border-y border-border">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-ink">
              Part of a broader ecosystem
            </h2>
            <p className="text-ink-muted leading-relaxed">
              CLEAR is the capability layer connecting enterprise reality to capital, insight, and long‑term resilience.
            </p>
            <p className="text-ink-muted leading-relaxed">
              Within the Be Noor ecosystem, CLEAR works alongside capital, research, and ecosystem programs. It turns front‑line founder reality into the discipline, data, and governance signals that investors, partners, and policymakers can trust.
            </p>
          </div>
          <div className="relative max-w-sm mx-auto">
            <svg viewBox="0 0 300 200" className="w-full h-auto" aria-hidden>
              <line x1="60" y1="100" x2="150" y2="100" stroke="var(--color-border)" strokeWidth="2" />
              <line x1="150" y1="100" x2="240" y2="100" stroke="var(--color-border)" strokeWidth="2" />
              <circle cx="60" cy="100" r="35" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="2" />
              <text x="60" y="105" textAnchor="middle" fill="var(--color-ink)" fontSize="12" fontWeight="500">Capital</text>
              <circle cx="150" cy="100" r="45" fill="var(--color-ink)" />
              <circle cx="150" cy="100" r="52" fill="none" stroke="var(--color-ink)" strokeWidth="2" opacity="0.3" />
              <text x="150" y="92" textAnchor="middle" fill="var(--color-bg)" fontSize="11" fontWeight="500">Capability</text>
              <text x="150" y="108" textAnchor="middle" fill="var(--color-bg)" fontSize="10" opacity="0.9">(CLEAR)</text>
              <circle cx="240" cy="100" r="35" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="2" />
              <text x="240" y="98" textAnchor="middle" fill="var(--color-ink)" fontSize="10" fontWeight="500">Insight</text>
              <text x="240" y="108" textAnchor="middle" fill="var(--color-ink)" fontSize="10" fontWeight="500">& Programs</text>
              <text x="150" y="180" textAnchor="middle" fill="var(--color-ink-muted)" fontSize="12" fontWeight="600">CLEAR ecosystem</text>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
