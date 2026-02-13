import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import DiagnosticProgress from "../DiagnosticProgress";

interface DataRealityProps {
  value: string[];
  onChange: (value: string[]) => void;
  onNext: () => void;
  onBack: () => void;
  step: number;
  totalSteps: number;
}

const options = [
  "Basic financials",
  "Operational data",
  "Customer or sales data",
  "Mostly intuition",
  "We're not sure what data matters",
];

const DataReality = ({
  value,
  onChange,
  onNext,
  onBack,
  step,
  totalSteps,
}: DataRealityProps) => {
  const toggleOption = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <div className="max-w-lg mx-auto w-full flex-1 flex flex-col">
        <DiagnosticProgress step={step} totalSteps={totalSteps} />

        <div className="flex-1 flex flex-col justify-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-foreground">
              What information do you currently have to support this decision?
            </h2>
            <p className="text-sm text-muted-foreground">
              Imperfect data is normal. Honesty helps us choose safely.
            </p>
          </div>

          <div className="space-y-3">
            {options.map((option) => {
              const isSelected = value.includes(option);

              return (
                <button
                  key={option}
                  onClick={() => toggleOption(option)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors flex items-center justify-between ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <span className="text-foreground">{option}</span>
                  {isSelected && (
                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between pt-8">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={onNext} disabled={value.length === 0}>
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataReality;
