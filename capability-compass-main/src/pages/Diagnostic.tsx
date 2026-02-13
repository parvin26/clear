import { useState } from "react";
import DiagnosticGate from "@/components/diagnostic/steps/DiagnosticGate";
import BusinessContext from "@/components/diagnostic/steps/BusinessContext";
import SituationCapture from "@/components/diagnostic/steps/SituationCapture";
import SituationClarifier from "@/components/diagnostic/steps/SituationClarifier";
import DecisionHorizon from "@/components/diagnostic/steps/DecisionHorizon";
import ClarityCheck from "@/components/diagnostic/steps/ClarityCheck";
import DataReality from "@/components/diagnostic/steps/DataReality";
import RiskAwareness from "@/components/diagnostic/steps/RiskAwareness";
import DiagnosticProcessing from "@/components/diagnostic/steps/DiagnosticProcessing";
import DiagnosticOutput from "@/components/diagnostic/steps/DiagnosticOutput";
import CapabilityTranslation from "@/components/diagnostic/steps/CapabilityTranslation";
import RecommendedPath from "@/components/diagnostic/steps/RecommendedPath";

export interface DiagnosticData {
  businessStage: string;
  situationDescription: string;
  situationClarifiers: string[];
  decisionHorizon: string;
  clarityLevel: string;
  dataAvailable: string[];
  riskLevel: string;
}

const Diagnostic = () => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<DiagnosticData>({
    businessStage: "",
    situationDescription: "",
    situationClarifiers: [],
    decisionHorizon: "",
    clarityLevel: "",
    dataAvailable: [],
    riskLevel: "",
  });

  const updateData = (updates: Partial<DiagnosticData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => Math.max(0, prev - 1));

  const totalSteps = 11;

  const renderStep = () => {
    switch (step) {
      case 0:
        return <DiagnosticGate onNext={nextStep} />;
      case 1:
        return (
          <BusinessContext
            value={data.businessStage}
            onChange={(v) => updateData({ businessStage: v })}
            onNext={nextStep}
            onBack={prevStep}
            step={step}
            totalSteps={totalSteps}
          />
        );
      case 2:
        return (
          <SituationCapture
            value={data.situationDescription}
            onChange={(v) => updateData({ situationDescription: v })}
            onNext={nextStep}
            onBack={prevStep}
            step={step}
            totalSteps={totalSteps}
          />
        );
      case 3:
        return (
          <SituationClarifier
            value={data.situationClarifiers}
            onChange={(v) => updateData({ situationClarifiers: v })}
            onNext={nextStep}
            onBack={prevStep}
            step={step}
            totalSteps={totalSteps}
          />
        );
      case 4:
        return (
          <DecisionHorizon
            value={data.decisionHorizon}
            onChange={(v) => updateData({ decisionHorizon: v })}
            onNext={nextStep}
            onBack={prevStep}
            step={step}
            totalSteps={totalSteps}
          />
        );
      case 5:
        return (
          <ClarityCheck
            value={data.clarityLevel}
            onChange={(v) => updateData({ clarityLevel: v })}
            onNext={nextStep}
            onBack={prevStep}
            step={step}
            totalSteps={totalSteps}
          />
        );
      case 6:
        return (
          <DataReality
            value={data.dataAvailable}
            onChange={(v) => updateData({ dataAvailable: v })}
            onNext={nextStep}
            onBack={prevStep}
            step={step}
            totalSteps={totalSteps}
          />
        );
      case 7:
        return (
          <RiskAwareness
            value={data.riskLevel}
            onChange={(v) => updateData({ riskLevel: v })}
            onNext={nextStep}
            onBack={prevStep}
            step={step}
            totalSteps={totalSteps}
          />
        );
      case 8:
        return <DiagnosticProcessing onNext={nextStep} />;
      case 9:
        return (
          <DiagnosticOutput
            data={data}
            onNext={nextStep}
            onBack={prevStep}
            step={step}
            totalSteps={totalSteps}
          />
        );
      case 10:
        return (
          <CapabilityTranslation
            data={data}
            onNext={nextStep}
            onBack={prevStep}
            step={step}
            totalSteps={totalSteps}
          />
        );
      case 11:
        return <RecommendedPath data={data} onBack={prevStep} />;
      default:
        return <DiagnosticGate onNext={nextStep} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderStep()}
    </div>
  );
};

export default Diagnostic;