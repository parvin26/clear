import { Button } from "@/components/ui/button";
import { ArrowRight, Search, Zap, LogOut, Shield } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

const offerings = [
  {
    icon: Search,
    title: "Standardised Diagnostics",
    description: "Comparable, auditable enterprise insight",
  },
  {
    icon: Zap,
    title: "Capability Activation",
    description: "Not advice, but operating discipline",
  },
  {
    icon: LogOut,
    title: "Ethical Exit",
    description: "No long-term dependency, measurable retention",
  },
];

const safeguards = [
  "Mandatory diagnostics before intervention",
  "Risk-based escalation rules",
  "Time-bound engagements",
  "Data privacy by design",
  "No mandated adoption",
];

const engagementOptions = [
  "Pilot CLEAR with SME portfolios",
  "Use diagnostics for capital readiness",
  "Consume anonymised ecosystem insights",
];

const Institutional = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-20">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-6">
              Enterprise Capability, Measured and Strengthened
            </h1>
            <p className="text-lg text-muted-foreground">
              CLEAR is Be Noor's enterprise capability framework, designed to improve capital outcomes and MSME resilience through structured diagnostics and ethical exits.
            </p>
          </div>
        </div>
      </section>

      {/* The Problem DFIs Face */}
      <section className="py-16 bg-card">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              The Missing Layer in Financial Inclusion
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              MSMEs receive capital and support, yet failure rates remain high. The missing layer is not access — it is institutionalised capability.
            </p>
          </div>
        </div>
      </section>

      {/* What CLEAR Provides */}
      <section className="py-16">
        <div className="container mx-auto max-w-7xl px-6">
          <h2 className="text-2xl font-semibold text-foreground mb-10">
            What CLEAR Provides
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {offerings.map((offering, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-lg p-6 space-y-4"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <offering.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-medium text-foreground">{offering.title}</h3>
                <p className="text-sm text-muted-foreground">{offering.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Governance & Safeguards */}
      <section className="py-16 bg-card">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold text-foreground">
                Governance & Safeguards
              </h2>
            </div>
            <ul className="space-y-3">
              {safeguards.map((safeguard, index) => (
                <li key={index} className="flex items-start gap-3 text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                  <span>{safeguard}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* How DFIs Engage */}
      <section className="py-16">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold text-foreground mb-8">
              How DFIs Engage
            </h2>
            <div className="space-y-4 mb-8">
              {engagementOptions.map((option, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <span className="text-foreground">{option}</span>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground border-l-2 border-primary pl-4">
              CLEAR informs decisions. It does not prescribe policy.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-card">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="max-w-xl mx-auto text-center space-y-6">
            <h2 className="text-2xl font-semibold text-foreground">
              Explore a Partnership
            </h2>
            <p className="text-muted-foreground">
              Learn how CLEAR can support your portfolio's capability development.
            </p>
            <Button size="lg" className="text-base px-8 py-6">
              Contact Us
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Institutional;
