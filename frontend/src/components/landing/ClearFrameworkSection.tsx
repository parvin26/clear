"use client";

const frameworkItems = [
  {
    letter: "C",
    label: "C: Clarify",
    body: "Define the real problem before choosing a solution.",
  },
  {
    letter: "L",
    label: "L: Locate",
    body: "Identify the highest-leverage constraint.",
  },
  {
    letter: "E",
    label: "E: Enable",
    body: "Commit to one decision with owners and a plan.",
  },
  {
    letter: "A",
    label: "A: Anchor",
    body: "Execute with structured milestones and check-ins.",
  },
  {
    letter: "R",
    label: "R: Renew",
    body: "Review outcomes. Feed learning into the next cycle.",
  },
];

export function ClearFrameworkSection() {
  return (
    <section id="clear-framework" className="py-16 md:py-20 bg-white border-y border-border">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="text-center mb-14">
          <h2 className="text-2xl md:text-3xl font-semibold text-ink mb-4">
            The CLEAR Framework
          </h2>
          <p className="text-ink-muted max-w-2xl mx-auto">
            The cycle your team follows inside the system. Every decision, same discipline.
          </p>
        </div>
        <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-5 md:gap-6">
          {frameworkItems.map((item, index) => (
            <div
              key={index}
              className="bg-background border border-border rounded-lg p-6 hover:border-primary/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold mb-4">
                {item.letter}
              </div>
              <h3 className="font-semibold text-ink mb-2 text-sm">{item.label}</h3>
              <p className="text-sm text-ink-muted leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
