import { BookOpen, Users, Calculator, Calendar } from "lucide-react";

const playbooks = [
  {
    icon: BookOpen,
    title: "Cash Visibility and Runway Discipline",
    description: "Build financial clarity without a full-time finance hire.",
  },
  {
    icon: Users,
    title: "Founder Decision Bottleneck",
    description: "Create decision frameworks that scale beyond you.",
  },
  {
    icon: Calculator,
    title: "Pricing and Margin Control",
    description: "Understand your unit economics and protect margins.",
  },
  {
    icon: Calendar,
    title: "Operating Cadence Installation",
    description: "Establish rhythms that keep the business moving.",
  },
];

const PlaybooksSection = () => {
  return (
    <section id="playbooks" className="py-20 bg-card">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="text-center mb-14">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
            Start With Self-Serve Playbooks
          </h2>
          <p className="text-muted-foreground">
            Most problems should be solved without humans.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {playbooks.map((playbook, index) => (
            <div
              key={index}
              className="bg-background border border-border rounded-lg p-6 hover:border-primary/30 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-insight/10 flex items-center justify-center mb-4 group-hover:bg-insight/20 transition-colors">
                <playbook.icon className="w-5 h-5 text-insight" />
              </div>
              <h3 className="font-medium text-foreground mb-2">{playbook.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {playbook.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlaybooksSection;
