"use client";

interface DiagnosticProgressProps {
  step: number;
  totalSteps: number;
}

export function DiagnosticProgress({ step, totalSteps }: DiagnosticProgressProps) {
  const progress = totalSteps > 0 ? (step / totalSteps) * 100 : 0;

  return (
    <div className="w-full">
      <div className="h-1 bg-divider rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-ink-muted mt-2 text-right">
        Step {step} of {totalSteps}
      </p>
    </div>
  );
}
