"use client";

const lenses = [
  { title: "Strategy", body: "Focus, trade‑offs, and what to say “no” to." },
  { title: "Finance", body: "Cash discipline, runway, and funding decisions." },
  { title: "Growth", body: "Unit economics, demand, and sustainable scale." },
  { title: "Operations", body: "Execution, reliability, and delivery rhythms." },
  { title: "Technology", body: "Systems, data, and the right level of digital maturity." },
];

export function LensCardsSection() {
  return (
    <section id="lenses" className="py-16 md:py-20 bg-surface border-y border-border">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-semibold text-ink mb-4">
            Capability lenses, not job titles
          </h2>
          <p className="text-ink-muted max-w-xl mx-auto">
            CLEAR looks at your business through capability domains, so you don’t need to know which “C‑level” you’re missing.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {lenses.map((item, index) => (
            <div
              key={index}
              className="bg-background border border-border rounded-xl p-6 text-center card-hover"
            >
              <span className="text-xs font-medium text-primary uppercase tracking-wide">{item.title}</span>
              <p className="text-sm text-ink-muted mt-2">{item.body}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <p className="text-sm text-ink-muted">Lenses support decisions. They never replace leadership.</p>
        </div>
      </div>
    </section>
  );
}
