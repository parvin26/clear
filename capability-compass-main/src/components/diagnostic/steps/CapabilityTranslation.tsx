import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import DiagnosticProgress from "../DiagnosticProgress";
import type { DiagnosticData } from "@/pages/Diagnostic";

interface CapabilityTranslationProps {
  data: DiagnosticData;
  onNext: () => void;
  onBack: () => void;
  step: number;
  totalSteps: number;
}

const getCapabilities = (clarifiers: string[]): string[] => {
  const capabilities: string[] = [];

  if (clarifiers.some((s) => s.includes("Cash") || s.includes("paying"))) {
    capabilities.push("Cash visibility and runway discipline");
    capabilities.push("Weekly financial decision rhythm");
  }
  if (clarifiers.some((s) => s.includes("decisions depend on me"))) {
    capabilities.push("Decision distribution framework");
    capabilities.push("Clarity on trade-offs and priorities");
  }
  if (clarifiers.some((s) => s.includes("Operations") || s.includes("messy"))) {
    capabilities.push("Operating cadence installation");
    capabilities.push("Execution reliability systems");
  }
  if (clarifiers.some((s) => s.includes("Sales") || s.includes("declining"))) {
    capabilities.push("Unit economics clarity");
    capabilities.push("Demand predictability framework");
  }
  if (clarifiers.some((s) => s.includes("Costs"))) {
    capabilities.push("Pricing and margin control");
  }
  if (clarifiers.some((s) => s.includes("not sure"))) {
    capabilities.push("Problem identification and diagnosis capability");
  }

  return capabilities.length > 0 ? capabilities : ["Problem clarity and decision structure"];
};

const CapabilityTranslation = ({
  data,
  onNext,
  onBack,
  step,
  totalSteps,
}: CapabilityTranslationProps) => {
  const capabilities = getCapabilities(data.situationClarifiers);

  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <div className="max-w-lg mx-auto w-full flex-1 flex flex-col">
        <DiagnosticProgress step={step} totalSteps={totalSteps} />

        <div className="flex-1 flex flex-col justify-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-foreground">
              What this problem actually requires
            </h2>
            <p className="text-muted-foreground">
              Solving this does not require more effort. It requires building the following capabilities:
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <ul className="space-y-3">
              {capabilities.map((capability, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-insight mt-2 flex-shrink-0" />
                  <span className="text-foreground">{capability}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            These are ways your business needs to operate consistently — not roles or hires.
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

export default CapabilityTranslation;
