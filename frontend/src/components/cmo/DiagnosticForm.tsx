"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDiagnosticPrefill, clearDiagnosticPrefill } from "@/lib/diagnostic-prefill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VoiceInputButton } from "@/components/ui/voice-input-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { postCmoDiagnostic } from "@/lib/api";
import { CMOInput } from "@/lib/types";
import { Loader2 } from "lucide-react";

const CHANNELS = [
  "Social Media",
  "Email Marketing",
  "SEO",
  "Google Ads",
  "Facebook Ads",
  "Content Marketing",
  "Influencer Marketing",
  "Trade Shows",
  "Direct Sales",
  "Referrals",
];

const MARKETING_TOOLS = [
  "Google Analytics",
  "Facebook Pixel",
  "CRM System",
  "Email Platform",
  "Marketing Automation",
  "Social Media Management",
  "SEO Tools",
  "A/B Testing Tools",
];

export function DiagnosticForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [prefillBanner, setPrefillBanner] = useState(false);
  const [formData, setFormData] = useState<Partial<CMOInput>>({
    effective_channels: [],
    marketing_tools: [],
    brand_confidence: 3,
  });

  useEffect(() => {
    const prefill = getDiagnosticPrefill();
    if (prefill?.domain === "cmo" && prefill.diagnosticData.situationDescription) {
      setFormData((prev) => ({
        ...prev,
        notes: (prefill.diagnosticData.situationDescription || prev.notes) ?? undefined,
      }));
      setPrefillBanner(true);
      clearDiagnosticPrefill();
    }
  }, []);

  const updateField = (field: keyof CMOInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayField = (field: "effective_channels" | "marketing_tools", value: string) => {
    setFormData((prev) => {
      const current = prev[field] || [];
      const newArray = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [field]: newArray };
    });
  };

  const handleSubmit = async () => {
    if (!formData.primary_challenge || !formData.marketing_plan_status) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await postCmoDiagnostic(formData as CMOInput);
      router.push(`/cmo/analysis/${response.id}`);
    } catch (error: any) {
      alert(`Error: ${error.message || "Failed to submit diagnostic"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl">Marketing Diagnostic</CardTitle>
          <CardDescription>
            Step {step} of 4: {step === 1 && "Overview"} {step === 2 && "Channels & Budget"}{" "}
            {step === 3 && "Strategy & Tools"} {step === 4 && "Review & Submit"}
          </CardDescription>
        </CardHeader>
        {prefillBanner && (
          <div className="mx-6 mb-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800">
            Your capability diagnostic answers have been used to prefill where possible.
          </div>
        )}
        <CardContent className="space-y-6">
          {/* Step 1: Overview */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="primary_challenge">Primary Marketing Challenge *</Label>
                <Select
                  value={formData.primary_challenge}
                  onValueChange={(value) => updateField("primary_challenge", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your primary challenge" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead_generation">Lead Generation</SelectItem>
                    <SelectItem value="brand_awareness">Brand Awareness</SelectItem>
                    <SelectItem value="retention">Customer Retention</SelectItem>
                    <SelectItem value="digital_eff">Digital Marketing Effectiveness</SelectItem>
                    <SelectItem value="roi">ROI Optimization</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="marketing_plan_status">Marketing Plan Status *</Label>
                <Select
                  value={formData.marketing_plan_status}
                  onValueChange={(value) => updateField("marketing_plan_status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal_comprehensive">Formal & Comprehensive</SelectItem>
                    <SelectItem value="formal_basic">Formal but Basic</SelectItem>
                    <SelectItem value="informal">Informal</SelectItem>
                    <SelectItem value="none">No Marketing Plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="customer_segmentation">Customer Segmentation Approach *</Label>
                <Select
                  value={formData.customer_segmentation}
                  onValueChange={(value) => updateField("customer_segmentation", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select approach" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="detailed_segments">Detailed Segments</SelectItem>
                    <SelectItem value="basic_segments">Basic Segments</SelectItem>
                    <SelectItem value="informal">Informal Understanding</SelectItem>
                    <SelectItem value="none">No Segmentation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Channels & Budget */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <Label>Effective Marketing Channels (Select all that apply)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                  {CHANNELS.map((channel) => (
                    <div key={channel} className="flex items-center space-x-2">
                      <Checkbox
                        id={`channel-${channel}`}
                        checked={formData.effective_channels?.includes(channel)}
                        onCheckedChange={() => toggleArrayField("effective_channels", channel)}
                      />
                      <Label htmlFor={`channel-${channel}`} className="font-normal cursor-pointer">
                        {channel}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="marketing_budget_percent">Marketing Budget (% of Revenue) *</Label>
                <Select
                  value={formData.marketing_budget_percent}
                  onValueChange={(value) => updateField("marketing_budget_percent", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-5">0-5%</SelectItem>
                    <SelectItem value="5-10">5-10%</SelectItem>
                    <SelectItem value="10-15">10-15%</SelectItem>
                    <SelectItem value="15-20">15-20%</SelectItem>
                    <SelectItem value="20+">20%+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="metrics_review_frequency">Metrics Review Frequency *</Label>
                <Select
                  value={formData.metrics_review_frequency}
                  onValueChange={(value) => updateField("metrics_review_frequency", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="rarely">Rarely</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 3: Strategy & Tools */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <Label>Marketing Tools in Use (Select all that apply)</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  {MARKETING_TOOLS.map((tool) => (
                    <div key={tool} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tool-${tool}`}
                        checked={formData.marketing_tools?.includes(tool)}
                        onCheckedChange={() => toggleArrayField("marketing_tools", tool)}
                      />
                      <Label htmlFor={`tool-${tool}`} className="font-normal cursor-pointer">
                        {tool}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="brand_confidence">
                  Brand Confidence Level: {formData.brand_confidence || 3}/5 *
                </Label>
                <Input
                  type="range"
                  min="1"
                  max="5"
                  value={formData.brand_confidence || 3}
                  onChange={(e) => updateField("brand_confidence", parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>

              <div>
                <Label htmlFor="strategy_alignment">Strategy Alignment with Business Goals *</Label>
                <Select
                  value={formData.strategy_alignment}
                  onValueChange={(value) => updateField("strategy_alignment", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select alignment level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fully_aligned">Fully Aligned</SelectItem>
                    <SelectItem value="mostly_aligned">Mostly Aligned</SelectItem>
                    <SelectItem value="partially_aligned">Partially Aligned</SelectItem>
                    <SelectItem value="not_aligned">Not Aligned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 4: Review & Notes */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <p className="text-sm text-muted-foreground mb-1">You can type or use the mic to speak.</p>
                <div className="flex gap-2 items-start">
                  <Textarea
                    id="notes"
                    placeholder="Any additional context or specific questions..."
                    value={formData.notes || ""}
                    onChange={(e) => updateField("notes", e.target.value)}
                    rows={6}
                    className="flex-1"
                  />
                  <VoiceInputButton
                    onTranscription={(text) =>
                      updateField("notes", (formData.notes || "") + (formData.notes ? " " : "") + text)
                    }
                    beforeText={formData.notes || ""}
                    aria-label="Speak to fill additional notes"
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Review Your Inputs:</h3>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>Primary Challenge: {formData.primary_challenge || "Not set"}</li>
                  <li>Channels: {formData.effective_channels?.length || 0} selected</li>
                  <li>Budget: {formData.marketing_budget_percent || "Not set"}</li>
                  <li>Brand Confidence: {formData.brand_confidence || "Not set"}/5</li>
                </ul>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
            >
              Previous
            </Button>
            {step < 4 ? (
              <Button onClick={() => setStep(step + 1)}>Next</Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Submit Diagnostic"
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

