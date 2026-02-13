import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface DiagnosticGateProps {
  onNext: () => void;
}

const DiagnosticGate = ({ onNext }: DiagnosticGateProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-lg text-center space-y-8">
        <div className="space-y-2">
          <div className="w-12 h-12 bg-primary rounded-sm flex items-center justify-center mx-auto mb-6">
            <span className="text-primary-foreground font-semibold text-sm">CL</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
            Capability Diagnostic
          </h1>
        </div>

        <div className="space-y-4 text-muted-foreground">
          <p className="leading-relaxed">
            This diagnostic helps clarify what's really happening in your business and what capability is missing beneath the symptoms.
          </p>
          <p className="leading-relaxed">
            It takes about 5–7 minutes.
          </p>
          <p className="leading-relaxed">
            There are no scores, no pitches, and no obligation.
          </p>
        </div>

        <Button size="lg" onClick={onNext} className="text-base px-8 py-6">
          Begin Diagnostic
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default DiagnosticGate;