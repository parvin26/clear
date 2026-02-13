"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDiagnosticPrefill, clearDiagnosticPrefill } from "@/lib/diagnostic-prefill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VoiceInputButton } from "@/components/ui/voice-input-button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ctoApi } from "@/lib/api";
import type { CTOInput, CTOAnalysisResponse } from "@/lib/types";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

interface DiagnosticFormProps {
  onSuccess?: (analysis: CTOAnalysisResponse) => void;
}

const TOTAL_STEPS = 3;

const challengeOptions = [
  "Building the MVP quickly",
  "Scaling infrastructure and users",
  "Security and compliance",
  "Integrating with external platforms/tools",
  "Maintenance and technical debt",
  "Innovation and new features",
];

const teamCompositionOptions = [
  "Fully in-house development team",
  "Hybrid (in-house + outsourced)",
  "Fully outsourced",
  "No dedicated tech team",
];

const techStackMaturityOptions = [
  "Early-stage MVP",
  "Growing product with some scalable components",
  "Scalable architecture ready for enterprise",
  "Established enterprise-grade platform",
];

const roadmapManagementOptions = [
  "Agile with defined sprints and backlog",
  "Ad-hoc planning and prioritization",
  "No formal roadmap process",
];

const operationalRisksOptions = [
  "High risk with frequent issues",
  "Manageable risk with monitoring",
  "Minimal or no known risks",
];

const devopsMaturityOptions = [
  "Fully embraced with CI/CD pipelines",
  "Partial adoption with manual deployments",
  "No cloud or DevOps practices",
];

const innovationInvestmentOptions = [
  "Significant ongoing investment",
  "Moderate exploratory budget",
  "Minimal or no formal investment",
];

export function DiagnosticForm({ onSuccess }: DiagnosticFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prefillBanner, setPrefillBanner] = useState(false);
  const [formData, setFormData] = useState<Partial<CTOInput>>({
    biggest_challenge: [],
    business_alignment: 3,
  });

  useEffect(() => {
    const prefill = getDiagnosticPrefill();
    if (prefill?.domain === "cto" && prefill.diagnosticData.situationDescription) {
      setFormData((prev) => ({
        ...prev,
        notes: (prefill.diagnosticData.situationDescription || prev.notes) ?? undefined,
      }));
      setPrefillBanner(true);
      clearDiagnosticPrefill();
    }
  }, []);

  const updateFormData = (field: keyof CTOInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const input: CTOInput = {
        biggest_challenge: formData.biggest_challenge || [],
        team_composition: formData.team_composition!,
        tech_stack_maturity: formData.tech_stack_maturity!,
        roadmap_management: formData.roadmap_management!,
        has_security_policies: formData.has_security_policies ?? false,
        operational_risks: formData.operational_risks!,
        devops_maturity: formData.devops_maturity!,
        business_alignment: formData.business_alignment || 3,
        innovation_investment: formData.innovation_investment!,
        notes: formData.notes,
      };

      const response = await ctoApi.diagnose(input);
      
      // Call onSuccess callback if provided (for dashboard integration)
      if (onSuccess) {
        onSuccess(response);
      } else {
        // Otherwise navigate to analysis page
        router.push(`/cto/analysis/${response.id}`);
      }
    } catch (error) {
      console.error("Error submitting diagnostic:", error);
      alert("Error submitting diagnostic. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.biggest_challenge &&
      formData.biggest_challenge.length > 0 &&
      formData.team_composition &&
      formData.tech_stack_maturity &&
      formData.roadmap_management &&
      formData.operational_risks &&
      formData.devops_maturity &&
      formData.innovation_investment
    );
  };

  const progress = (currentStep / TOTAL_STEPS) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Technology Diagnostic</CardTitle>
          <CardDescription>
            Step {currentStep} of {TOTAL_STEPS}
          </CardDescription>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
        {prefillBanner && (
          <div className="mx-6 mb-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800">
            Your capability diagnostic answers have been used to prefill where possible.
          </div>
        )}
        <CardContent className="space-y-6">
          {/* Step 1: Infra & Stack */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>
                  1. What is the biggest technology or product challenge your company is facing?
                </Label>
                <div className="space-y-3">
                  {challengeOptions.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={option}
                        checked={formData.biggest_challenge?.includes(option)}
                        onCheckedChange={(checked) => {
                          const current = formData.biggest_challenge || [];
                          if (checked) {
                            updateFormData("biggest_challenge", [...current, option]);
                          } else {
                            updateFormData(
                              "biggest_challenge",
                              current.filter((c) => c !== option)
                            );
                          }
                        }}
                      />
                      <Label htmlFor={option} className="font-normal cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="team_composition">
                  2. What is the composition of your technology team?
                </Label>
                <Select
                  value={formData.team_composition || ""}
                  onValueChange={(value) => updateFormData("team_composition", value)}
                >
                  <SelectTrigger id="team_composition">
                    <SelectValue placeholder="Select team composition" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamCompositionOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tech_stack_maturity">
                  3. What best describes your current technology stack maturity?
                </Label>
                <Select
                  value={formData.tech_stack_maturity || ""}
                  onValueChange={(value) => updateFormData("tech_stack_maturity", value)}
                >
                  <SelectTrigger id="tech_stack_maturity">
                    <SelectValue placeholder="Select stack maturity" />
                  </SelectTrigger>
                  <SelectContent>
                    {techStackMaturityOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: DevOps & Security */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="roadmap_management">
                  4. How do you manage your product roadmap?
                </Label>
                <Select
                  value={formData.roadmap_management || ""}
                  onValueChange={(value) => updateFormData("roadmap_management", value)}
                >
                  <SelectTrigger id="roadmap_management">
                    <SelectValue placeholder="Select roadmap management approach" />
                  </SelectTrigger>
                  <SelectContent>
                    {roadmapManagementOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>5. Do you have documented IT security and data governance policies?</Label>
                <RadioGroup
                  value={formData.has_security_policies?.toString() || ""}
                  onValueChange={(value) =>
                    updateFormData("has_security_policies", value === "true")
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="security-yes" />
                    <Label htmlFor="security-yes" className="font-normal cursor-pointer">
                      Yes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="security-no" />
                    <Label htmlFor="security-no" className="font-normal cursor-pointer">
                      No
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>6. Are there critical operational or cybersecurity risks currently?</Label>
                <RadioGroup
                  value={formData.operational_risks || ""}
                  onValueChange={(value) => updateFormData("operational_risks", value)}
                >
                  {operationalRisksOptions.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={option} />
                      <Label htmlFor={option} className="font-normal cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="devops_maturity">
                  7. How mature is your cloud adoption and DevOps capability?
                </Label>
                <Select
                  value={formData.devops_maturity || ""}
                  onValueChange={(value) => updateFormData("devops_maturity", value)}
                >
                  <SelectTrigger id="devops_maturity">
                    <SelectValue placeholder="Select DevOps maturity" />
                  </SelectTrigger>
                  <SelectContent>
                    {devopsMaturityOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 3: Cloud & Budget */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <Label>
                  8. Rate the alignment between technology initiatives and overall business goals
                  (1-5 scale)
                </Label>
                <div className="space-y-2">
                  <Slider
                    value={[formData.business_alignment || 3]}
                    onValueChange={([value]) => updateFormData("business_alignment", value)}
                    min={1}
                    max={5}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>1 - Poor</span>
                    <span className="font-semibold text-foreground">
                      {formData.business_alignment || 3}
                    </span>
                    <span>5 - Excellent</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="innovation_investment">
                  9. How much do you invest in innovation, R&D, or emerging technologies?
                </Label>
                <Select
                  value={formData.innovation_investment || ""}
                  onValueChange={(value) => updateFormData("innovation_investment", value)}
                >
                  <SelectTrigger id="innovation_investment">
                    <SelectValue placeholder="Select innovation investment level" />
                  </SelectTrigger>
                  <SelectContent>
                    {innovationInvestmentOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <p className="text-sm text-muted-foreground">You can type or use the mic to speak.</p>
                <div className="flex gap-2 items-start">
                  <Textarea
                    id="notes"
                    placeholder="Any additional information about your technology situation..."
                    value={formData.notes || ""}
                    onChange={(e) => updateFormData("notes", e.target.value)}
                    rows={4}
                    className="flex-1"
                  />
                  <VoiceInputButton
                    onTranscription={(text) =>
                      updateFormData("notes", (formData.notes || "") + (formData.notes ? " " : "") + text)
                    }
                    beforeText={formData.notes || ""}
                    aria-label="Speak to fill additional notes"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1 || isSubmitting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            {currentStep < TOTAL_STEPS ? (
              <Button onClick={nextStep}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!isFormValid() || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Submit Diagnostic
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

