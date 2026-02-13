import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface OperationsWelcomeProps {
  onContinue: () => void;
}

const OperationsWelcome = ({ onContinue }: OperationsWelcomeProps) => {
  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <div className="max-w-lg mx-auto w-full flex-1 flex flex-col justify-center">
        <div className="space-y-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
            Reducing Firefighting
          </h1>

          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p>
              When operations rely on heroics, everyone gets tired.
            </p>

            <div className="space-y-3">
              <p>We'll focus on:</p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>stabilising the most fragile points</li>
                <li>introducing simple operating rhythms</li>
                <li>removing bottlenecks that drain attention</li>
              </ul>
            </div>

            <p>
              This is about reliability, not bureaucracy.
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

export default OperationsWelcome;
