import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface FinanceWelcomeProps {
  onContinue: () => void;
}

const FinanceWelcome = ({ onContinue }: FinanceWelcomeProps) => {
  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <div className="max-w-lg mx-auto w-full flex-1 flex flex-col justify-center">
        <div className="space-y-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
            Making Financial Reality Visible
          </h1>

          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p>
              Financial stress usually isn't about math. It's about uncertainty.
            </p>

            <div className="space-y-3">
              <p>We'll focus on:</p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>understanding your real cash position</li>
                <li>identifying the few levers that actually matter</li>
                <li>setting a repeatable decision rhythm</li>
              </ul>
            </div>

            <p>
              You don't need perfect data. You need clear, honest signals.
            </p>
          </div>

          <Button size="lg" onClick={onContinue} className="text-base px-8 py-6">
            Continue
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FinanceWelcome;
