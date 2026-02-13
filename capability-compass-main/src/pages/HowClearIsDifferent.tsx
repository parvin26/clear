import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

const comparisons = [
  {
    title: "CLEAR vs Consulting",
    clear: [
      "Installs capability, does not rent expertise",
      "Time-bound engagement with clear exit",
      "You retain the operating discipline",
      "No recurring retainers or dependencies",
    ],
    other: [
      "Provides advice and recommendations",
      "Often ongoing or project-based",
      "Expertise leaves when consultants leave",
      "Creates dependency on external input",
    ],
  },
  {
    title: "CLEAR vs Advisory",
    clear: [
      "Structured support for specific decisions",
      "Advisors are activated only when needed",
      "Focus on building your judgment",
      "Designed to exit",
    ],
    other: [
      "General guidance and mentorship",
      "Ongoing relationship-based",
      "Relies on advisor's judgment",
      "Often indefinite engagement",
    ],
  },
  {
    title: "CLEAR vs Training",
    clear: [
      "Installs operating discipline",
      "Applied to your real problems",
      "Habits that sustain after exit",
      "Capability built through doing",
    ],
    other: [
      "Transfers knowledge",
      "Generic curriculum",
      "Often forgotten after sessions",
      "Learning without application",
    ],
  },
  {
    title: "CLEAR vs Capital",
    clear: [
      "Builds the capability to use capital well",
      "Diagnostic before deployment",
      "Reduces risk of capital waste",
      "Complements capital, does not replace it",
    ],
    other: [
      "Provides financial resources",
      "Assumes capability exists",
      "Risk of misallocation",
      "Capital alone cannot build discipline",
    ],
  },
];

const HowClearIsDifferent = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-6">
              How CLEAR Is Different
            </h1>
            <p className="text-lg text-muted-foreground">
              CLEAR is not consulting, advisory, training, or capital. It's capability infrastructure designed to exit once the capability is internalised.
            </p>
          </div>
        </div>
      </section>

      {/* Comparisons */}
      {comparisons.map((comparison, index) => (
        <section
          key={index}
          className={`py-16 ${index % 2 === 0 ? "bg-card" : ""}`}
        >
          <div className="container mx-auto max-w-7xl px-6">
            <h2 className="text-xl font-semibold text-foreground mb-8">
              {comparison.title}
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {/* CLEAR */}
              <div className="bg-background border border-primary/20 rounded-lg p-6">
                <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  CLEAR
                </h3>
                <ul className="space-y-3">
                  {comparison.clear.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-3">
                      <div className="w-1 h-1 rounded-full bg-primary mt-2" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Other */}
              <div className="bg-background border border-border rounded-lg p-6">
                <h3 className="font-medium text-muted-foreground mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                  Typical Approach
                </h3>
                <ul className="space-y-3">
                  {comparison.other.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-3">
                      <div className="w-1 h-1 rounded-full bg-muted-foreground/50 mt-2" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Closing */}
      <section className="py-20">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-2xl font-semibold text-foreground">
              CLEAR exists to leave.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HowClearIsDifferent;
