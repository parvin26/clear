"use client";

const painPoints = [
  { title: "Cash pressure", description: "Cash always feels tight, even when revenue grows." },
  { title: "Founder bottleneck", description: "Every important decision depends on one person." },
  { title: "Heroic operations", description: "Work gets done through effort and firefighting, not systems." },
  { title: "Busy but uncertain", description: "The team is working hard, but outcomes still feel unpredictable." },
];

export function PainValidationSection() {
  return (
    <section id="pains" className="py-16 md:py-20 bg-surface border-y border-border">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-semibold text-ink mb-4">
            Does this feel familiar?
          </h2>
          <p className="text-ink-muted max-w-xl mx-auto">
            Different businesses, same pattern: effort is high, but capability gaps keep you stuck.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {painPoints.map((point, index) => (
            <div
              key={index}
              className="bg-background border border-border rounded-xl p-6 card-hover"
            >
              <h3 className="font-semibold text-ink mb-2">{point.title}</h3>
              <p className="text-sm text-ink-muted leading-relaxed">{point.description}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <p className="text-sm text-ink-muted">These are not effort problems. They are capability gaps.</p>
        </div>
      </div>
    </section>
  );
}
