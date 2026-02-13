"use client";

const playbooks = [
  { title: "Cash visibility and runway", description: "Simple tools and playbooks to understand where your money goes and how long it lasts." },
  { title: "Founder decision bottleneck", description: "Frameworks that move decisions from your head into shared, repeatable structures." },
  { title: "Pricing and margin control", description: "Step‑by‑step guidance to set prices, protect margins, and stop silent leakage." },
  { title: "Operating cadence", description: "Lightweight rituals that keep the business moving in one direction." },
];

export function PlaybooksSection() {
  return (
    <section id="self-serve" className="py-16 md:py-20">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="text-center mb-14">
          <h2 className="text-2xl md:text-3xl font-semibold text-ink mb-4">
            Start with self‑serve. Add humans only when needed.
          </h2>
          <p className="text-ink-muted max-w-xl mx-auto">
            Most problems should be solved through better capability, not more headcount.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {playbooks.map((item, index) => (
            <div
              key={index}
              className="bg-surface border border-border rounded-xl p-6 card-hover"
            >
              <span className="text-xs font-medium text-primary uppercase tracking-wide">Playbook</span>
              <h3 className="font-semibold text-ink mt-2 mb-2">{item.title}</h3>
              <p className="text-sm text-ink-muted leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <p className="text-sm text-ink-muted max-w-2xl mx-auto">
            When self‑serve isn’t enough, CLEAR uses human advisors selectively—always scoped by the diagnostic, never by guesswork.
          </p>
        </div>
      </div>
    </section>
  );
}
