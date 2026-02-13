import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import DiagnosticProgress from "../DiagnosticProgress";
import type { DiagnosticData } from "@/pages/Diagnostic";

interface DiagnosticOutputProps {
  data: DiagnosticData;
  onNext: () => void;
  onBack: () => void;
  step: number;
  totalSteps: number;
}

const getDomain = (clarifiers: string[]): string => {
  if (clarifiers.some((s) => s.includes("Cash") || s.includes("paying"))) return "Finance";
  if (clarifiers.some((s) => s.includes("decisions depend on me"))) return "Strategy";
  if (clarifiers.some((s) => s.includes("Operations") || s.includes("messy"))) return "Operations";
  if (clarifiers.some((s) => s.includes("Sales") || s.includes("declining"))) return "Growth";
  if (clarifiers.some((s) => s.includes("Costs"))) return "Finance";
  return "Operations";
};

const getProblemType = (clarityLevel: string): string => {
  if (clarityLevel.includes("reacting")) return "Reactive";
  if (clarityLevel.includes("trade-offs")) return "Strategic";
  if (clarityLevel.includes("options")) return "Decisional";
  return "Operational";
};

const DiagnosticOutput = ({
  data,
  onNext,
  onBack,
  step,
  totalSteps,
}: DiagnosticOutputProps) => {
  const domain = getDomain(data.situationClarifiers);
  const problemType = getProblemType(data.clarityLevel);

  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <div className="max-w-lg mx-auto w-full flex-1 flex flex-col">
        <DiagnosticProgress step={step} totalSteps={totalSteps} />

        <div className="flex-1 flex flex-col justify-center space-y-8">
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">
            Here's what we see
          </h2>

          {/* Situation Block */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-2">
            <p className="text-sm text-muted-foreground font-medium">Your situation</p>
            <p className="text-foreground leading-relaxed">
              {data.situationDescription || "A decision is blocked or unclear."}
            </p>
          </div>

          {/* Classification Block */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Problem type:</span>
              <span className="text-foreground font-medium">{problemType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Primary domain:</span>
              <span className="text-foreground font-medium">{domain}</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            This helps us avoid solving the wrong problem first.
          </p>
        </div>

        <div className="flex justify-between pt-8">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={onNext}>
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticOutput;