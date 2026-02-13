import { Button } from "@/components/ui/button";
import { ArrowRight, Wallet, Users, DollarSign, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

const playbooks = [
  {
    icon: Wallet,
    title: "Cash Visibility & Runway Discipline",
    description: "Know your real cash position and make calm financial decisions weekly.",
  },
  {
    icon: Users,
    title: "Founder Decision Bottleneck",
    description: "Distribute decisions without losing control.",
  },
  {
    icon: DollarSign,
    title: "Pricing & Margin Control",
    description: "Stop revenue from quietly destroying value.",
  },
  {
    icon: Clock,
    title: "Operating Cadence Installation",
    description: "Replace firefighting with simple execution rhythms.",
  },
];

const steps = [
  "Start with the diagnostic",
  "Use the recommended playbook",
  "Apply it for 30–90 days",
  "Exit with capability retained",
];

const Playbooks = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-20">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-6">
              Start With Playbooks
            </h1>
            <p className="text-lg text-muted-foreground mb-4">
              Most capability gaps can be solved without advisors, meetings, or long engagements.
            </p>
            <p className="text-muted-foreground">
              These playbooks install discipline step-by-step so your business can operate more confidently on its own.
            </p>
          </div>
        </div>
      </section>

      {/* What a CLEAR Playbook Is */}
      <section className="py-16 bg-card">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              What a CLEAR Playbook Is
            </h2>
            <p className="text-muted-foreground mb-6">
              A CLEAR playbook is not advice. It is a capability installer.
            </p>
            <p className="text-muted-foreground mb-4">Each playbook:</p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <span>targets one specific problem</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <span>introduces simple operating discipline</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <span>builds habits your team can sustain</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <span>defines a clear exit point</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* What These Are Not */}
      <section className="py-16">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              What These Are Not
            </h2>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-2" />
                <span>Not consulting reports</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-2" />
                <span>Not generic training</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-2" />
                <span>Not long-term programs</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-2" />
                <span>Not dependent on external experts</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Example Playbooks */}
      <section className="py-16 bg-card">
        <div className="container mx-auto max-w-7xl px-6">
          <h2 className="text-2xl font-semibold text-foreground mb-10">
            Example Playbooks
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {playbooks.map((playbook, index) => (
              <div
                key={index}
                className="bg-background border border-border rounded-lg p-6 space-y-4"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <playbook.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-medium text-foreground">{playbook.title}</h3>
                <p className="text-sm text-muted-foreground">{playbook.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Use a Playbook */}
      <section className="py-16">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold text-foreground mb-8">
              How to Use a Playbook
            </h2>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <span className="text-foreground">{step}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-8">
              If a playbook isn't enough, CLEAR will tell you.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-card">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="max-w-xl mx-auto text-center space-y-6">
            <h2 className="text-2xl font-semibold text-foreground">
              Begin With Clarity
            </h2>
            <Link to="/diagnostic">
              <Button size="lg" className="text-base px-8 py-6">
                Start Capability Diagnostic
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground">
              Advisors are introduced only when necessary.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Playbooks;
