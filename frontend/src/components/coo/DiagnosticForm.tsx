"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { getDiagnosticPrefill, clearDiagnosticPrefill } from "@/lib/diagnostic-prefill";

import { postCooDiagnostic } from "@/lib/api";
import {
  type COOInput,
  type OperationalChallenge,
  type OpsManagementSystems,
  type KPITrackingMethod,
  type SOPCoverage,
  type CostOverrunType,
  type VendorManagementMaturity,
  type WorkforceDevelopment,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VoiceInputButton } from "@/components/ui/voice-input-button";

const challengeOptions: { label: string; value: OperationalChallenge }[] = [
  { label: "Scaling operations to meet demand", value: "scaling_operations" },
  {
    label: "Supply chain inefficiencies",
    value: "supply_chain_inefficiencies",
  },
  { label: "Quality assurance and control", value: "quality_assurance" },
  {
    label: "Workforce productivity and management",
    value: "workforce_productivity",
  },
  {
    label: "Process standardization and documentation",
    value: "process_standardization",
  },
  { label: "Digital transformation adoption", value: "digital_transformation" },
];

const opsSystemsOptions: { label: string; value: OpsManagementSystems }[] = [
  { label: "Yes, custom-built solutions", value: "custom_built" },
  {
    label: "Yes, off-the-shelf software (SAP, Oracle, etc.)",
    value: "off_the_shelf",
  },
  { label: "Partial use of systems", value: "partial_use" },
  { label: "No formal operational systems", value: "no_formal_systems" },
];

const kpiTrackingOptions: { label: string; value: KPITrackingMethod }[] = [
  { label: "Real-time dashboards", value: "realtime_dashboards" },
  { label: "Manual spreadsheets or reports", value: "manual_spreadsheets" },
  { label: "No formal tracking process", value: "no_formal_tracking" },
];

const sopOptions: { label: string; value: SOPCoverage }[] = [
  { label: "Yes, fully documented and current", value: "fully_documented" },
  { label: "Yes, documented but outdated", value: "documented_outdated" },
  { label: "No SOPs documented", value: "no_sops" },
];

const costOverrunOptions: { label: string; value: CostOverrunType }[] = [
  { label: "Procurement and vendor costs", value: "procurement_vendor" },
  { label: "Labor and workforce management", value: "labor_workforce" },
  { label: "Logistics and transportation", value: "logistics_transportation" },
  { label: "Equipment maintenance", value: "equipment_maintenance" },
  { label: "Other", value: "other" },
];

const vendorManagementOptions: {
  label: string;
  value: VendorManagementMaturity;
}[] = [
  { label: "Fully managed with KPIs and contracts", value: "fully_managed" },
  { label: "Partially managed", value: "partially_managed" },
  { label: "No formal vendor management", value: "no_formal_management" },
];

const workforceDevOptions: { label: string; value: WorkforceDevelopment }[] = [
  {
    label: "Continuous training and reskilling programs",
    value: "continuous_training",
  },
  { label: "Ad-hoc training only", value: "ad_hoc_training" },
  { label: "None currently", value: "none" },
];

const defaultData: COOInput = {
  biggest_operational_challenge: "scaling_operations",
  ops_management_systems: "partial_use",
  kpi_tracking_method: "manual_spreadsheets",
  has_documented_sops: "documented_outdated",
  cost_overruns: [] as CostOverrunType[],
  cost_overruns_other: null,
  vendor_management_maturity: "partially_managed",
  operational_efficiency_rating: 3,
  workforce_development: [] as WorkforceDevelopment[],
  sustainability_compliance: false,
  monthly_output_units: [0, 0, 0],
  monthly_ops_costs: [0.0, 0.0, 0.0],
  ops_systems_used: [],
  ops_team_size: 5,
};

const steps = [
  "Operational Challenges",
  "Costs & Systems",
  "Monthly Data",
  "Workforce & Compliance",
];

export function DiagnosticForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<COOInput>(defaultData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefillBanner, setPrefillBanner] = useState(false);

  useEffect(() => {
    const prefill = getDiagnosticPrefill();
    if (prefill?.domain === "coo" && prefill.diagnosticData.situationDescription) {
      setFormData((prev) => ({
        ...prev,
        notes: (prefill.diagnosticData.situationDescription || prev.notes) ?? null,
      }));
      setPrefillBanner(true);
      clearDiagnosticPrefill();
    }
  }, []);

  const nextStep = () =>
    setStep((prev) => Math.min(prev + 1, steps.length - 1));
  const previousStep = () => setStep((prev) => Math.max(prev - 1, 0));

  const handleSubmit = async () => {
    // Basic validation
    if (
      !formData.biggest_operational_challenge ||
      !formData.ops_management_systems ||
      !formData.kpi_tracking_method ||
      !formData.has_documented_sops ||
      formData.cost_overruns.length === 0 ||
      !formData.vendor_management_maturity ||
      !formData.operational_efficiency_rating ||
      formData.workforce_development.length === 0 ||
      formData.ops_team_size === 0 ||
      (formData.monthly_output_units !== undefined &&
        formData.monthly_output_units.some((v) => v === 0)) ||
      (formData.monthly_ops_costs !== undefined &&
        formData.monthly_ops_costs.some((v) => v === 0))
    ) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await postCooDiagnostic(formData);
      router.push(`/coo/analysis/${result.id}`);
    } catch (err: any) {
      setError(err.message || "Could not submit diagnostic. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stepContent = useMemo(() => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <Label>1. What is your biggest operational challenge? *</Label>
              <Select
                value={formData.biggest_operational_challenge || ""}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    biggest_operational_challenge:
                      value as OperationalChallenge,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select challenge" />
                </SelectTrigger>
                <SelectContent>
                  {challengeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>
                2. Do you currently use any operational management systems? *
              </Label>
              <Select
                value={formData.ops_management_systems || ""}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    ops_management_systems: value as OpsManagementSystems,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select system" />
                </SelectTrigger>
                <SelectContent>
                  {opsSystemsOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>3. How do you track and monitor operational KPIs? *</Label>
              <Select
                value={formData.kpi_tracking_method || ""}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    kpi_tracking_method: value as KPITrackingMethod,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {kpiTrackingOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>
                4. Do you have standard operating procedures (SOPs) documented?
                *
              </Label>
              <Select
                value={formData.has_documented_sops || ""}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    has_documented_sops: value as SOPCoverage,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  {sopOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label>
                5. Where are your largest cost overruns currently occurring? *
              </Label>
              <Select
                value={formData.cost_overruns[0] || ""}
                onValueChange={(value) => {
                  setFormData((prev) => ({
                    ...prev,
                    cost_overruns:
                      value === "other"
                        ? ["other"]
                        : [value as CostOverrunType],
                    cost_overruns_other:
                      value === "other" ? prev.cost_overruns_other : null,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select cost overrun area" />
                </SelectTrigger>
                <SelectContent>
                  {costOverrunOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.cost_overruns.includes("other") && (
                <div className="mt-3">
                  <Input
                    placeholder="Please specify other cost overruns"
                    value={formData.cost_overruns_other ?? ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        cost_overruns_other: e.target.value || null,
                      }))
                    }
                  />
                </div>
              )}
            </div>
            <div>
              <Label>
                6. How mature is your vendor management and outsourcing
                strategy? *
              </Label>
              <Select
                value={formData.vendor_management_maturity || ""}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    vendor_management_maturity:
                      value as VendorManagementMaturity,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select maturity level" />
                </SelectTrigger>
                <SelectContent>
                  {vendorManagementOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>
                7. Rate your operational efficiency on a scale of 1 to 5 *
              </Label>
              <div className="mt-2 flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    type="button"
                    variant={
                      formData.operational_efficiency_rating === rating
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        operational_efficiency_rating: rating,
                      }))
                    }
                    className="w-12"
                  >
                    {rating}
                  </Button>
                ))}
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Current rating: {formData.operational_efficiency_rating}/5
              </p>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label>8. Monthly Output Units (Last 3 months) *</Label>
              <div className="space-y-2 mt-2">
                {(formData.monthly_output_units || [0, 0, 0]).map(
                  (val, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Label className="w-24 text-sm">Month {idx + 1}:</Label>
                      <Input
                        type="number"
                        value={val === 0 ? "" : val}
                        onChange={(e) => {
                          const newUnits = [
                            ...(formData.monthly_output_units || [0, 0, 0]),
                          ];
                          newUnits[idx] = parseInt(e.target.value) || 0;
                          setFormData({
                            ...formData,
                            monthly_output_units: newUnits,
                          });
                        }}
                        onFocus={(e) => {
                          if (e.target.value === "0") {
                            e.target.value = "";
                          }
                        }}
                        placeholder="Units"
                      />
                    </div>
                  )
                )}
              </div>
            </div>
            <div>
              <Label>9. Monthly Operational Costs (Last 3 months) *</Label>
              <div className="space-y-2 mt-2">
                {(formData.monthly_ops_costs || [0, 0, 0]).map((val, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Label className="w-24 text-sm">Month {idx + 1}:</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={val === 0 ? "" : val}
                      onChange={(e) => {
                        const newCosts = [
                          ...(formData.monthly_ops_costs || [0, 0, 0]),
                        ];
                        newCosts[idx] = parseFloat(e.target.value) || 0;
                        setFormData({
                          ...formData,
                          monthly_ops_costs: newCosts,
                        });
                      }}
                      onFocus={(e) => {
                        if (e.target.value === "0") {
                          e.target.value = "";
                        }
                      }}
                      placeholder="Cost"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>10. Operational Team Size *</Label>
              <Input
                type="number"
                value={
                  formData.ops_team_size === 0 ? "" : formData.ops_team_size
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ops_team_size: parseInt(e.target.value) || 0,
                  })
                }
                onFocus={(e) => {
                  if (e.target.value === "0") {
                    e.target.value = "";
                  }
                }}
                placeholder="Number of team members"
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label>
                11. What workforce development initiatives do you have in place?
                *
              </Label>
              <Select
                value={formData.workforce_development[0] || ""}
                onValueChange={(value) => {
                  setFormData((prev) => ({
                    ...prev,
                    workforce_development: [value as WorkforceDevelopment],
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select workforce development initiative" />
                </SelectTrigger>
                <SelectContent>
                  {workforceDevOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>
                12. Are sustainability or regulatory compliance considerations
                part of your operational strategy? *
              </Label>
              <div className="mt-3 flex gap-4">
                <Button
                  type="button"
                  variant={
                    formData.sustainability_compliance ? "default" : "outline"
                  }
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      sustainability_compliance: true,
                    }))
                  }
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  variant={
                    !formData.sustainability_compliance ? "default" : "outline"
                  }
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      sustainability_compliance: false,
                    }))
                  }
                >
                  No
                </Button>
              </div>
            </div>
            <div>
              <Label>Additional context (optional)</Label>
              <p className="text-sm text-muted-foreground mb-1">Describe your challenges or context. You can type or use the mic to speak.</p>
              <div className="flex gap-2 items-start">
                <Textarea
                  placeholder="Any additional information about your operations, challenges, or context..."
                  value={formData.notes ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      notes: e.target.value || null,
                    }))
                  }
                  rows={4}
                  className="flex-1"
                />
                <VoiceInputButton
                  onTranscription={(text) =>
                    setFormData((prev) => ({
                      ...prev,
                      notes: (prev.notes ?? "") + (prev.notes ? " " : "") + text,
                    }))
                  }
                  beforeText={formData.notes ?? ""}
                  aria-label="Speak to fill additional context"
                />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  }, [step, formData]);

  return (
    <Card className="max-w-4xl mx-auto shadow-sm">
      <CardHeader>
        <CardTitle>COO Diagnostic Form</CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Step {step + 1} of {steps.length}: {steps[step]}
        </p>
      </CardHeader>
      {prefillBanner && (
        <div className="mx-6 mb-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800">
          Your capability diagnostic answers have been used to prefill where possible.
        </div>
      )}
      <CardContent className="space-y-6">
        {stepContent}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="ghost" onClick={previousStep} disabled={step === 0}>
            Back
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={nextStep}>Next</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Analyzing..." : "Submit Diagnostic"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
