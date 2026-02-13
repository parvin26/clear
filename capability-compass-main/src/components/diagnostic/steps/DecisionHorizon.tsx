import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import DiagnosticProgress from "../DiagnosticProgress";

interface DecisionHorizonProps {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
  step: number;
  totalSteps: number;
}

const options = [
  "Within 30 days",
  "Within 90 days",
  "Within 6 months",
  "No fixed timeline, but it's weighing on us",
];

const DecisionHorizon = ({
  value,
  onChange,
  onNext,
  onBack,
  step,
  totalSteps,
}: DecisionHorizonProps) => {
  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <div className="max-w-lg mx-auto w-full flex-1 flex flex-col">
        <DiagnosticProgress step={step} totalSteps={totalSteps} />

        <div className="flex-1 flex flex-col justify-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-foreground">
              When does this decision need to be made?
            </h2>
            <p className="text-sm text-muted-foreground">
              Timing affects what kind of support is responsible.
            </p>
          </div>

          <div className="space-y-3">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => onChange(option)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  value === option
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <span className="text-foreground">{option}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between pt-8">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={onNext} disabled={!value}>
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DecisionHorizon;
