import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, BookOpen, Users, Pause } from "lucide-react";
import type { DiagnosticData } from "@/pages/Diagnostic";
import { Link, useNavigate } from "react-router-dom";

interface RecommendedPathProps {
  data: DiagnosticData;
  onBack: () => void;
}

type RiskCategory = "high" | "medium" | "low";

const getRiskCategory = (data: DiagnosticData): RiskCategory => {
  // High risk situations require human support
  if (data.riskLevel === "Business viability risk" || data.riskLevel === "Reputational or compliance risk") {
    return "high";
  }

  // Medium risk - playbook first
  if (data.riskLevel === "Cash stress" || data.riskLevel === "Slower growth") {
    return "medium";
  }

  // Low risk - self-directed
  return "low";
};

const RecommendedPath = ({ data, onBack }: RecommendedPathProps) => {
  const navigate = useNavigate();
  const riskCategory = getRiskCategory(data);

  const handleSaveAndExit = () => {
    // For now, just navigate home. Could save to localStorage in the future.
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <div className="max-w-lg mx-auto w-full flex-1 flex flex-col">
        <div className="flex-1 flex flex-col justify-center space-y-8">
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">
            Recommended next step
          </h2>

          {/* Primary Recommendation Card */}
          <div className="bg-card border-2 border-primary rounded-lg p-8 space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-primary uppercase tracking-wide">Recommended</p>
                <h3 className="text-lg font-semibold text-foreground">
                  Human Support
                </h3>
              </div>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              This situation carries meaningful risk and trade-offs. A short session with an experienced advisor can help you navigate decisions more safely.
            </p>

            <Button size="lg" className="w-full text-base py-6">
              Book Session
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Secondary Options */}
          <div className="space-y-3">
            {/* Continue Independently */}
            <div className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-2">
                  <h4 className="font-medium text-foreground">Continue Independently</h4>
                  <p className="text-sm text-muted-foreground">
                    Work through a structured playbook designed for this type of situation.
                  </p>
                  <Link to="/playbooks">
                    <Button variant="outline" size="sm" className="mt-2">
                      View Playbook
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Pause */}
            <div className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Pause className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-2">
                  <h4 className="font-medium text-foreground">Pause</h4>
                  <p className="text-sm text-muted-foreground">
                    You can stop here and return anytime.
                  </p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={handleSaveAndExit}>
                    Save & Exit
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-start pt-8">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RecommendedPath;