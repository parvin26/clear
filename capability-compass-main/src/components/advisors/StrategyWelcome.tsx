import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface StrategyWelcomeProps {
  onContinue: () => void;
}

const StrategyWelcome = ({ onContinue }: StrategyWelcomeProps) => {
  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <div className="max-w-lg mx-auto w-full flex-1 flex flex-col justify-center">
        <div className="space-y-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
            Clarifying What to Focus On
          </h1>

          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p>
              Strategy problems rarely come from lack of ideas. They come from 
              unclear trade-offs.
            </p>

            <div className="space-y-3">
              <p>We'll work through:</p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>what truly matters right now</li>
                <li>what must wait</li>
                <li>what consequences follow each choice</li>
              </ul>
            </div>

            <p>
              The goal is not a "strategy document." The goal is clear decisions 
              you can enforce daily.
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

export default StrategyWelcome;
