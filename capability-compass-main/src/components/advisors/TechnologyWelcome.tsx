import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface TechnologyWelcomeProps {
  onContinue: () => void;
}

const TechnologyWelcome = ({ onContinue }: TechnologyWelcomeProps) => {
  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <div className="max-w-lg mx-auto w-full flex-1 flex flex-col justify-center">
        <div className="space-y-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
            Making Systems Support Decisions
          </h1>

          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p>
              Technology should reduce risk and friction — not add complexity.
            </p>

            <div className="space-y-3">
              <p>We'll focus on:</p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>which systems truly matter</li>
                <li>what needs to be reliable first</li>
                <li>how to reduce fragility without overspending</li>
              </ul>
            </div>

            <p>
              The goal is calm, dependable systems, not shiny tools.
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

export default TechnologyWelcome;
