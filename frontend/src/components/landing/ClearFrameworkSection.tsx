"use client";

const frameworkItems = [
  {
    letter: "C",
    label: "C — Clarify the situation",
    body: "Understand what is really happening in the business, using your own words, without jargon or judgment.",
  },
  {
    letter: "L",
    label: "L — Locate the real capability gaps",
    body: "Translate symptoms like cash pressure or team chaos into specific capability gaps, not vague “work harder” advice.",
  },
  {
    letter: "E",
    label: "E — Enable the right capability",
    body: "Turn your top gaps into a focused execution plan with milestones, metrics, and the lightest effective support.",
  },
  {
    letter: "A",
    label: "A — Anchor the capability",
    body: "Use structured reviews so what you learn in each cycle becomes part of how the business operates.",
  },
  {
    letter: "R",
    label: "R — Release dependency",
    body: "As capability strengthens, CLEAR steps back. Dependency is treated as a failure condition, not a business model.",
  },
];

export function ClearFrameworkSection() {
  return (
    <section id="clear-framework" className="py-16 md:py-20 bg-white border-y border-border">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="text-center mb-14">
          <h2 className="text-2xl md:text-3xl font-semibold text-ink mb-4">
            The CLEAR capability framework
          </h2>
          <p className="text-ink-muted max-w-2xl mx-auto">
            Capability is not a job title. It is how your business makes decisions, executes, and learns under stress.
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
