import { Search, ArrowRightLeft, Zap } from "lucide-react";

const pillars = [
  {
    icon: Search,
    title: "Diagnose",
    description: "Identify the real problem, not symptoms.",
    highlight: true,
  },
  {
    icon: ArrowRightLeft,
    title: "Translate",
    description: "Convert problems into the capabilities your business must build. Not roles or hires.",
    highlight: false,
  },
  {
    icon: Zap,
    title: "Activate",
    description: "Build capability using playbooks, AI advisors, or humans.",
    highlight: false,
  },
];

const DifferentiationSection = () => {
  return (
    <section id="why-clear" className="py-20">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="text-center mb-14">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
            Built Different. Built for Capability.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {pillars.map((pillar, index) => (
            <div
              key={index}
              className="text-center space-y-4"
            >
              <div 
                className={`w-14 h-14 rounded-xl mx-auto flex items-center justify-center ${
                  pillar.highlight 
                    ? 'bg-insight/15 ring-2 ring-insight/30' 
                    : 'bg-primary/10'
                }`}
              >
                <pillar.icon 
                  className={`w-6 h-6 ${pillar.highlight ? 'text-insight' : 'text-primary'}`} 
                />
              </div>
              <h3 className="font-medium text-lg text-foreground">{pillar.title}</h3>
              <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>

        {/* Closing line */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground font-medium max-w-md mx-auto">
            CLEAR is designed to exit once capability is internalised.
          </p>
        </div>
      </div>
    </section>
  );
};

export default DifferentiationSection;
