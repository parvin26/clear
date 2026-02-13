const steps = [
  {
    number: 1,
    title: "Diagnose",
    subtitle: "your core problem",
    highlighted: true,
  },
  {
    number: 2,
    title: "Translate",
    subtitle: "it into capability gaps",
    highlighted: false,
  },
  {
    number: 3,
    title: "Activate",
    subtitle: "the lightest effective support",
    highlighted: false,
  },
  {
    number: 4,
    title: "Retain (Exit with Capability)",
    subtitle: "capability and exit responsibly",
    highlighted: false,
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-20 bg-card">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="text-center mb-14">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
            From Uncertainty to Execution
          </h2>
        </div>

        {/* Desktop: Horizontal Timeline */}
        <div className="hidden md:block">
          <div className="relative">
            {/* Progress line */}
            <div className="absolute top-8 left-[12.5%] right-[12.5%] h-0.5 bg-border" />

            <div className="grid grid-cols-4 gap-6 relative">
              {steps.map((step, index) => (
                <div key={index} className="text-center">
                  {/* Number circle */}
                  <div
                    className={`relative z-10 w-16 h-16 rounded-full mx-auto flex items-center justify-center text-lg font-semibold mb-6 ${
                      step.highlighted
                        ? 'bg-insight text-white ring-4 ring-insight/20'
                        : 'bg-background border-2 border-border text-foreground'
                    }`}
                  >
                    {step.number}
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.subtitle}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile: Vertical */}
        <div className="md:hidden space-y-6">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-4">
              {/* Number and line */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold ${
                    step.highlighted
                      ? 'bg-insight text-white ring-4 ring-insight/20'
                      : 'bg-background border-2 border-border text-foreground'
                  }`}
                >
                  {step.number}
                </div>
                {index < steps.length - 1 && (
                  <div className="w-0.5 flex-1 bg-border mt-2" />
                )}
              </div>
              {/* Content */}
              <div className="pb-6">
                <h3 className="font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.subtitle}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Supporting line */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            No long-term dependency. No role outsourcing.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
