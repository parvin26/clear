import { useEffect } from "react";

interface DiagnosticProcessingProps {
  onNext: () => void;
}

const DiagnosticProcessing = ({ onNext }: DiagnosticProcessingProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onNext();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onNext]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-lg text-center space-y-8">
        <div className="space-y-4">
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">
            Analysing Capability Gaps
          </h2>
          <p className="text-muted-foreground">
            We're classifying the problem, not evaluating your performance.
          </p>
        </div>

        {/* Loading animation */}
        <div className="flex justify-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0ms" }} />
          <div className="w-3 h-3 rounded-full bg-primary animate-pulse" style={{ animationDelay: "150ms" }} />
          <div className="w-3 h-3 rounded-full bg-primary animate-pulse" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
};

export default DiagnosticProcessing;
