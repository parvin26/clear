import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface GrowthWelcomeProps {
  onContinue: () => void;
}

const GrowthWelcome = ({ onContinue }: GrowthWelcomeProps) => {
  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <div className="max-w-lg mx-auto w-full flex-1 flex flex-col justify-center">
        <div className="space-y-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
            Making Growth Predictable
          </h1>

          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p>
              Growth problems aren't solved by doing more. They're solved by 
              understanding what works — and why.
            </p>

            <div className="space-y-3">
              <p>We'll work through:</p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>where growth creates value</li>
                <li>where it destroys cash</li>
                <li>which levers are worth pulling next</li>
              </ul>
            </div>

            <p>
              The goal is disciplined growth, not activity.
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

export default GrowthWelcome;
