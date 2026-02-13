import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface UniversalWelcomeProps {
  onContinue: () => void;
}

const UniversalWelcome = ({ onContinue }: UniversalWelcomeProps) => {
  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <div className="max-w-lg mx-auto w-full flex-1 flex flex-col justify-center">
        <div className="space-y-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
            Let's work through this clearly.
          </h1>

          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p>
              I'm here to help you structure this decision and build the capability 
              to handle similar situations in the future.
            </p>
            <p>
              I won't replace your judgment or make decisions for you. I will help 
              you clarify options, understand trade-offs, and design next steps 
              that fit your reality.
            </p>
            <p>
              We'll focus on one problem at a time, and we'll stop once the 
              capability is in place.
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

export default UniversalWelcome;
