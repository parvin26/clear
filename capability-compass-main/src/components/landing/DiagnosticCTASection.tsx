import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const DiagnosticCTASection = () => {
  return (
    <section className="py-20 bg-card">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
            Start With Clarity
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            The diagnostic takes under 7 minutes. You'll receive a clear capability map. Not advice, not pitches, and no obligation to continue.
          </p>
          <Button size="lg" className="text-base px-8 py-6">
            Start Capability Diagnostic
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default DiagnosticCTASection;
