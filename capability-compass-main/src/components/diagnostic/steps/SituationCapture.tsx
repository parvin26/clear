import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight } from "lucide-react";
import DiagnosticProgress from "../DiagnosticProgress";

interface SituationCaptureProps {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
  step: number;
  totalSteps: number;
}

const SituationCapture = ({
  value,
  onChange,
  onNext,
  onBack,
  step,
  totalSteps,
}: SituationCaptureProps) => {
  // No validation - allow any input
  const canContinue = value.trim().length > 0;

  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <div className="max-w-lg mx-auto w-full flex-1 flex flex-col">
        <DiagnosticProgress step={step} totalSteps={totalSteps} />

        <div className="flex-1 flex flex-col justify-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-foreground">
              What's happening in your business right now?
            </h2>
            <p className="text-sm text-muted-foreground">
              Describe the situation in your own words. Don't worry about being precise — we'll help clarify it.
            </p>
          </div>

          <div className="space-y-3">
            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="e.g. customers not paying, sales slowing, costs increasing, too many decisions sitting with me"
              className="min-h-[140px] resize-none"
            />
          </div>
        </div>

        <div className="flex justify-between pt-8">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={onNext} disabled={!canContinue}>
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SituationCapture;