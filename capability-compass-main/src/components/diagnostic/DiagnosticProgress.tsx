interface DiagnosticProgressProps {
  step: number;
  totalSteps: number;
}

const DiagnosticProgress = ({ step, totalSteps }: DiagnosticProgressProps) => {
  const progress = (step / totalSteps) * 100;

  return (
    <div className="w-full">
      <div className="h-1 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-right">
        Step {step} of {totalSteps}
      </p>
    </div>
  );
};

export default DiagnosticProgress;
