import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight } from "lucide-react";
import DiagnosticProgress from "../DiagnosticProgress";

interface ProblemStatementProps {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
  step: number;
  totalSteps: number;
}

const ProblemStatement = ({
  value,
  onChange,
  onNext,
  onBack,
  step,
  totalSteps,
}: ProblemStatementProps) => {
  const isValid = value.trim().length > 10;

  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <div className="max-w-lg mx-auto w-full flex-1 flex flex-col">
        <DiagnosticProgress step={step} totalSteps={totalSteps} />

        <div className="flex-1 flex flex-col justify-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-foreground">
              In one sentence, what decision or problem are you trying to solve?
            </h2>
          </div>

          <div className="space-y-3">
            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Example: Revenue is growing, but cash keeps tightening and we don't know why."
              className="min-h-[120px] resize-none"
            />
            {value.length > 0 && !isValid && (
              <p className="text-sm text-muted-foreground">
                Try to describe what must change or what decision is blocked.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-between pt-8">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={onNext} disabled={!isValid}>
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProblemStatement;
