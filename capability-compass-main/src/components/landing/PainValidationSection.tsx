import { TrendingDown, Settings, Monitor, Compass } from "lucide-react";

const painPoints = [
  {
    icon: TrendingDown,
    title: "Cash Pressure",
    description: "Cash always feels tight, even when revenue grows.",
  },
  {
    icon: Settings,
    title: "Founder Bottleneck",
    description: "Founder decisions bottleneck everything.",
  },
  {
    icon: Monitor,
    title: "Heroic Operations",
    description: "Operations rely on heroics, not systems.",
  },
  {
    icon: Compass,
    title: "Busy But Uncertain",
    description: "Growth efforts feel busy but unpredictable.",
  },
];

const PainValidationSection = () => {
  return (
    <section className="py-20 bg-card">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
            Does this sound familiar?
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {painPoints.map((point, index) => (
            <div
              key={index}
              className="bg-background border border-border rounded-lg p-6 hover:border-primary/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <point.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-medium text-foreground mb-2">{point.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {point.description}
              </p>
            </div>
          ))}
        </div>

        {/* Closing line */}
        <div className="text-center mt-10">
          <p className="text-muted-foreground font-medium">
            These are not effort problems. They are capability gaps.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PainValidationSection;
