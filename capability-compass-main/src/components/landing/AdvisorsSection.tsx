import { Target, Wallet, TrendingUp, Cog, Shield } from "lucide-react";

const advisors = [
  {
    icon: Target,
    title: "Strategy Advisor",
    focus: "Focus and trade-offs",
  },
  {
    icon: Wallet,
    title: "Finance Advisor",
    focus: "Cash and decision discipline",
  },
  {
    icon: TrendingUp,
    title: "Growth Advisor",
    focus: "Unit economics and demand",
  },
  {
    icon: Cog,
    title: "Operations Advisor",
    focus: "Execution and reliability",
  },
  {
    icon: Shield,
    title: "Technology Advisor",
    focus: "Systems and risk",
  },
];

const AdvisorsSection = () => {
  return (
    <section id="advisors" className="py-20">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="text-center mb-14">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
            Capability Lenses, Not Job Titles
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-2">
            Advisors support decisions. They do not replace leadership.
          </p>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Advisors are introduced only when structured playbooks and AI support are not enough.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {advisors.map((advisor, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-lg p-6 text-center hover:border-primary/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <advisor.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-medium text-foreground mb-2">{advisor.title}</h3>
              <p className="text-sm text-muted-foreground">{advisor.focus}</p>
            </div>
          ))}
        </div>

        {/* Caption */}
        <div className="text-center mt-10">
          <p className="text-sm text-muted-foreground">
            Advisors are activated only when self-serve playbooks are not enough.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AdvisorsSection;
