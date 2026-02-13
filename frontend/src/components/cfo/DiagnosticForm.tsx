"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDiagnosticPrefill, clearDiagnosticPrefill } from "@/lib/diagnostic-prefill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VoiceInputButton } from "@/components/ui/voice-input-button";
import { postCfoDiagnostic } from "@/lib/api";
import type { CFOInput } from "@/lib/types";
import { Loader2, Plus, X } from "lucide-react";

const CHALLENGES = [
  { value: "cash_flow_management", label: "Cash Flow Management" },
  { value: "profitability_optimization", label: "Profitability Optimization" },
  { value: "forecasting_budgeting", label: "Forecasting & Budgeting" },
  { value: "fundraising_access", label: "Fundraising / Access to Capital" },
  { value: "cost_control", label: "Cost Control & Efficiency" },
  { value: "financial_risk_management", label: "Financial Risk Management" },
];

const FUNDING_STRUCTURES = [
  { value: "self_funded", label: "Self-Funded" },
  { value: "bank_loans", label: "Bank Loan(s)" },
  { value: "venture_investment", label: "Venture Capital / Angel" },
  { value: "grants_support", label: "Grants or Government Support" },
  { value: "other", label: "Other (please specify)" },
];

const FINANCIAL_STATEMENTS = [
  { value: "monthly_internal_team", label: "Yes – Internal finance team" },
  { value: "monthly_external_accountant", label: "Yes – External accountant / CPA" },
  { value: "no_formal_statements", label: "No formal monthly financial statements" },
];

const SYSTEMS = [
  { value: "erp", label: "ERP (SAP, Oracle, etc.)" },
  { value: "accounting_software", label: "Accounting software (QuickBooks, Xero, etc.)" },
  { value: "spreadsheets", label: "Manual / Spreadsheets" },
  { value: "none", label: "None" },
];

const UNIT_ECONOMICS = [
  { value: "detailed_visible", label: "Yes, detailed and updated regularly" },
  { value: "limited_visibility", label: "Yes, but limited or intermittent" },
  { value: "no_visibility", label: "No visibility" },
];

const KPI_FREQUENCIES = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "ad_hoc", label: "Rarely or ad-hoc" },
];

const FUNDRAISING_PLANS = [
  { value: "active", label: "Actively planning" },
  { value: "considering", label: "Considering options" },
  { value: "no_plans", label: "No current plans" },
];

const COST_OPTIMIZATION_OPTIONS = [
  { value: "tech_automation", label: "Implementing technology-driven automation" },
  { value: "outsourcing_finance", label: "Outsourcing finance functions" },
  { value: "process_optimization", label: "Process optimization programs" },
  { value: "none", label: "None at this time" },
  { value: "other", label: "Other (please specify)" },
];

const INDUSTRIES = [
  { value: "manufacturing", label: "Manufacturing" },
  { value: "retail", label: "Retail & Distribution" },
  { value: "services", label: "Professional / Services" },
  { value: "technology", label: "Technology / Software" },
  { value: "agriculture", label: "Agriculture" },
  { value: "logistics", label: "Logistics" },
  { value: "other", label: "Other" },
];

const MARKETS = [
  { value: "domestic", label: "Domestic only" },
  { value: "east_africa", label: "East Africa" },
  { value: "west_africa", label: "West Africa" },
  { value: "southern_africa", label: "Southern Africa" },
  { value: "north_africa", label: "North Africa" },
  { value: "global", label: "Global / Export" },
];

const FX_EXPOSURES = [
  { value: "single_currency", label: "Single currency" },
  { value: "low", label: "Low exposure" },
  { value: "moderate", label: "Moderate exposure" },
  { value: "high", label: "High exposure" },
];

const INVENTORY_POSTURES = [
  { value: "lean", label: "Lean" },
  { value: "balanced", label: "Balanced" },
  { value: "overstocked", label: "Overstocked" },
  { value: "not_applicable", label: "Not applicable" },
];

const CREDIT_FACILITIES = [
  { value: "overdraft", label: "Bank overdraft" },
  { value: "working_capital_line", label: "Working capital line" },
  { value: "invoice_discounting", label: "Invoice discounting / factoring" },
  { value: "asset_finance", label: "Asset finance" },
  { value: "none", label: "None" },
];

const RISK_APPETITES = [
  { value: "conservative", label: "Conservative" },
  { value: "balanced", label: "Balanced" },
  { value: "growth", label: "Growth-focused" },
  { value: "aggressive", label: "Aggressive" },
];

const OUTPUT_FOCUS = [
  { value: "cash_flow", label: "Cash flow focus" },
  { value: "board_summary", label: "Board-ready summary" },
  { value: "deep_finance_dive", label: "Deep financial dive" },
  { value: "lender_pack", label: "Materials for lenders/investors" },
];

const STEP_TITLES: Record<number, string> = {
  1: "Overview",
  2: "Numbers",
  3: "Structure",
  4: "Profile",
};
const TOTAL_STEPS = 4;

export function DiagnosticForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [prefillBanner, setPrefillBanner] = useState(false);
  const [formData, setFormData] = useState<Partial<CFOInput>>({
    biggest_challenge: "",
    monthly_revenue: [0, 0, 0],
    monthly_expenses: [0, 0, 0],
    cash_on_hand: 0,
    debt: 0,
    upcoming_payments: null,
    funding_structure: "",
    funding_structure_other: null,
    financial_statements: "",
    systems_used: [],
    unit_economics_visibility: "",
    industry: "",
    primary_markets: [],
    fx_exposure: "",
    top_revenue_streams: ["Main product"],
    avg_collection_period_days: 45,
    overdue_invoices_percent: 10,
    inventory_posture: "",
    credit_facilities: [],
    risk_appetite: "",
    preferred_output_focus: [],
    kpi_review_frequency: "",
    fundraising_plan: "",
    financial_control_confidence: 3,
    cost_optimization_initiatives: [],
    cost_optimization_other: null,
    notes: null,
  });

  useEffect(() => {
    const prefill = getDiagnosticPrefill();
    if (prefill?.domain === "cfo" && prefill.diagnosticData.situationDescription) {
      setFormData((prev) => ({
        ...prev,
        notes: (prefill.diagnosticData.situationDescription || prev.notes) ?? null,
      }));
      setPrefillBanner(true);
      clearDiagnosticPrefill();
    }
  }, []);

  const addRevenueMonth = () => {
    if (formData.monthly_revenue && formData.monthly_revenue.length < 6) {
      setFormData({
        ...formData,
        monthly_revenue: [...formData.monthly_revenue, 0],
      });
    }
  };

  const removeRevenueMonth = (index: number) => {
    if (formData.monthly_revenue && formData.monthly_revenue.length > 3) {
      const newRevenue = formData.monthly_revenue.filter((_, i) => i !== index);
      setFormData({ ...formData, monthly_revenue: newRevenue });
    }
  };

  const addExpenseMonth = () => {
    if (formData.monthly_expenses && formData.monthly_expenses.length < 6) {
      setFormData({
        ...formData,
        monthly_expenses: [...formData.monthly_expenses, 0],
      });
    }
  };

  const removeExpenseMonth = (index: number) => {
    if (formData.monthly_expenses && formData.monthly_expenses.length > 3) {
      const newExpenses = formData.monthly_expenses.filter((_, i) => i !== index);
      setFormData({ ...formData, monthly_expenses: newExpenses });
    }
  };

  const toggleSystem = (system: string) => {
    const current = formData.systems_used || [];
    let updated: string[] = [];
    if (system === "none") {
      updated = current.includes("none") ? [] : ["none"];
    } else {
      updated = current.includes(system)
        ? current.filter((s) => s !== system)
        : [...current.filter((s) => s !== "none"), system];
    }
    setFormData({ ...formData, systems_used: updated });
  };

  const toggleCostInitiative = (initiative: string) => {
    const current = formData.cost_optimization_initiatives || [];
    let updated: string[] = [];
    if (initiative === "none") {
      updated = current.includes("none") ? [] : ["none"];
    } else {
      updated = current.includes(initiative)
        ? current.filter((item) => item !== initiative)
        : [...current.filter((item) => item !== "none"), initiative];
    }
    setFormData({ ...formData, cost_optimization_initiatives: updated });
  };

  const togglePrimaryMarket = (market: string) => {
    const current = formData.primary_markets || [];
    const updated = current.includes(market)
      ? current.filter((item) => item !== market)
      : [...current, market];
    setFormData({ ...formData, primary_markets: updated });
  };

  const toggleCreditFacility = (facility: string) => {
    const current = formData.credit_facilities || [];
    let updated: string[] = [];
    if (facility === "none") {
      updated = current.includes("none") ? [] : ["none"];
    } else {
      updated = current.includes(facility)
        ? current.filter((item) => item !== facility)
        : [...current.filter((item) => item !== "none"), facility];
    }
    setFormData({ ...formData, credit_facilities: updated });
  };

  const toggleOutputFocus = (focus: string) => {
    const current = formData.preferred_output_focus || [];
    const updated = current.includes(focus)
      ? current.filter((item) => item !== focus)
      : [...current, focus];
    setFormData({ ...formData, preferred_output_focus: updated });
  };

  const addRevenueStream = () => {
    const streams = formData.top_revenue_streams || [];
    if (streams.length >= 5) return;
    setFormData({ ...formData, top_revenue_streams: [...streams, ""] });
  };

  const updateRevenueStream = (index: number, value: string) => {
    const streams = [...(formData.top_revenue_streams || [])];
    streams[index] = value;
    setFormData({ ...formData, top_revenue_streams: streams });
  };

  const removeRevenueStream = (index: number) => {
    const streams = formData.top_revenue_streams || [];
    if (streams.length <= 1) return;
    setFormData({
      ...formData,
      top_revenue_streams: streams.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async () => {
    if (
      !formData.biggest_challenge ||
      !formData.funding_structure ||
      !formData.financial_statements ||
      !formData.unit_economics_visibility ||
      !formData.industry ||
      !formData.primary_markets ||
      formData.primary_markets.length === 0 ||
      !formData.fx_exposure ||
      !formData.top_revenue_streams ||
      formData.top_revenue_streams.length === 0 ||
      formData.top_revenue_streams.some((stream) => !stream.trim()) ||
      formData.avg_collection_period_days === undefined ||
      formData.overdue_invoices_percent === undefined ||
      !formData.inventory_posture ||
      !formData.credit_facilities ||
      formData.credit_facilities.length === 0 ||
      !formData.risk_appetite ||
      !formData.preferred_output_focus ||
      formData.preferred_output_focus.length === 0 ||
      !formData.kpi_review_frequency ||
      !formData.fundraising_plan ||
      formData.financial_control_confidence === undefined ||
      !formData.cost_optimization_initiatives ||
      formData.cost_optimization_initiatives.length === 0
    ) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const revenue = formData.monthly_revenue || [];
      const expenses = formData.monthly_expenses || [];
      const payload: CFOInput = {
        biggest_challenge: formData.biggest_challenge!,
        monthly_revenue: revenue.map((v) => Number(v)),
        monthly_expenses: expenses.map((v) => Number(v)),
        cash_on_hand: Number(formData.cash_on_hand ?? 0),
        debt: Number(formData.debt ?? 0),
        upcoming_payments: formData.upcoming_payments != null ? Number(formData.upcoming_payments) : null,
        funding_structure: formData.funding_structure!,
        funding_structure_other: formData.funding_structure_other || null,
        financial_statements: formData.financial_statements!,
        systems_used: formData.systems_used || [],
        unit_economics_visibility: formData.unit_economics_visibility!,
        industry: formData.industry!,
        primary_markets: formData.primary_markets || [],
        fx_exposure: formData.fx_exposure!,
        top_revenue_streams: formData.top_revenue_streams || [],
        avg_collection_period_days: Number(formData.avg_collection_period_days ?? 0),
        overdue_invoices_percent: Number(formData.overdue_invoices_percent ?? 0),
        inventory_posture: formData.inventory_posture!,
        credit_facilities: formData.credit_facilities || [],
        risk_appetite: formData.risk_appetite!,
        preferred_output_focus: formData.preferred_output_focus || [],
        kpi_review_frequency: formData.kpi_review_frequency!,
        fundraising_plan: formData.fundraising_plan!,
        financial_control_confidence: Number(formData.financial_control_confidence ?? 1),
        cost_optimization_initiatives: formData.cost_optimization_initiatives || [],
        cost_optimization_other: formData.cost_optimization_other || null,
        notes: formData.notes || null,
      };

      const result = await postCfoDiagnostic(payload);
      router.push(`/cfo/analysis/${result.id}`);
    } catch (error: unknown) {
      console.error("Error submitting diagnostic:", error);
      const err = error as { response?: { data?: { detail?: string | unknown[] }; status?: number }; message?: string };
      const data = err.response?.data;
      const detail = data && typeof data === "object" && "detail" in data ? data.detail : null;
      let msg: string | null = null;
      if (typeof detail === "string") msg = detail;
      else if (Array.isArray(detail) && detail.length > 0) {
        const first = detail[0];
        msg = typeof first === "object" && first !== null && "msg" in first
          ? `${(first as { msg: string }).msg}${"loc" in first ? ` (${(first as { loc: string[] }).loc?.join(".")})` : ""}`
          : String(first);
      }
      const fallback = error instanceof Error ? error.message : err.message ?? "Please try again.";
      const isNetwork = err.response == null;
      const finalMessage = msg
        ? `Diagnostic failed: ${msg}`
        : isNetwork
          ? `Request failed. Check that the backend is running and try again. ${fallback}`
          : `Failed to submit diagnostic. ${fallback}`;
      alert(finalMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
        <CardHeader>
        <CardTitle>CFO Diagnostic Form</CardTitle>
        <CardDescription>
          Step {step} of {TOTAL_STEPS}: {STEP_TITLES[step]}
        </CardDescription>
      </CardHeader>
      {prefillBanner && (
        <div className="mx-6 mb-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800">
          Your capability diagnostic answers have been used to prefill where possible.
        </div>
      )}
      <CardContent className="space-y-6">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="challenge">Biggest Challenge *</Label>
              <Select
                value={formData.biggest_challenge || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, biggest_challenge: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a challenge" />
                </SelectTrigger>
                <SelectContent>
                  {CHALLENGES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="kpi">How often do you review financial KPIs? *</Label>
              <Select
                value={formData.kpi_review_frequency || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, kpi_review_frequency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {KPI_FREQUENCIES.map((freq) => (
                    <SelectItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="fundraising">Are you planning to raise funds? *</Label>
              <Select
                value={formData.fundraising_plan || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, fundraising_plan: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {FUNDRAISING_PLANS.map((plan) => (
                    <SelectItem key={plan.value} value={plan.value}>
                      {plan.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="confidence">
                Confidence in financial controls (1 - 5) *
              </Label>
              <Input
                id="confidence"
                type="number"
                min={1}
                max={5}
                value={formData.financial_control_confidence}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    financial_control_confidence: Math.min(
                      5,
                      Math.max(1, parseInt(e.target.value || "1", 10))
                    ),
                  })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                1 = Low confidence, 5 = High confidence
              </p>
            </div>

            <div>
              <Label>Cost optimization / automation initiatives *</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Select all that apply
              </p>
              <div className="space-y-2">
                {COST_OPTIMIZATION_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-start gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={formData.cost_optimization_initiatives?.includes(option.value)}
                      onChange={() => toggleCostInitiative(option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              {formData.cost_optimization_initiatives?.includes("other") && (
                <div className="mt-3">
                  <Label htmlFor="cost-other">Describe other initiatives</Label>
                  <Input
                    id="cost-other"
                    value={formData.cost_optimization_other || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cost_optimization_other: e.target.value,
                      })
                    }
                    placeholder="Brief description"
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <p className="text-sm text-muted-foreground mb-1">You can type or use the mic to speak about your situation.</p>
              <div className="flex gap-2 items-start">
                <Textarea
                  id="notes"
                  value={formData.notes || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={4}
                  placeholder="Any additional context about your financial situation..."
                  className="flex-1"
                />
                <VoiceInputButton
                  onTranscription={(text) =>
                    setFormData((prev) => ({
                      ...prev,
                      notes: (prev.notes || "") + (prev.notes ? " " : "") + text,
                    }))
                  }
                  beforeText={formData.notes || ""}
                  aria-label="Speak to fill additional notes"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Monthly Revenue (Last 3-6 months) *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRevenueMonth}
                  disabled={formData.monthly_revenue?.length === 6}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Month
                </Button>
              </div>
              <div className="space-y-2">
                {formData.monthly_revenue?.map((val, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={val === undefined || val === null ? "" : val}
                      onChange={(e) => {
                        const v = e.target.value;
                        const num = v === "" ? 0 : parseFloat(v);
                        const newRevenue = [...(formData.monthly_revenue || [])];
                        newRevenue[idx] = Number.isNaN(num) ? 0 : num;
                        setFormData({ ...formData, monthly_revenue: newRevenue });
                      }}
                      placeholder={`Month ${idx + 1}`}
                    />
                    {formData.monthly_revenue && formData.monthly_revenue.length > 3 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRevenueMonth(idx)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Monthly Expenses (Last 3-6 months) *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addExpenseMonth}
                  disabled={formData.monthly_expenses?.length === 6}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Month
                </Button>
              </div>
              <div className="space-y-2">
                {formData.monthly_expenses?.map((val, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={val === undefined || val === null ? "" : val}
                      onChange={(e) => {
                        const v = e.target.value;
                        const num = v === "" ? 0 : parseFloat(v);
                        const newExpenses = [...(formData.monthly_expenses || [])];
                        newExpenses[idx] = Number.isNaN(num) ? 0 : num;
                        setFormData({ ...formData, monthly_expenses: newExpenses });
                      }}
                      placeholder={`Month ${idx + 1}`}
                    />
                    {formData.monthly_expenses && formData.monthly_expenses.length > 3 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeExpenseMonth(idx)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="cash">Cash on Hand *</Label>
              <Input
                id="cash"
                type="number"
                step="0.01"
                min={0}
                value={formData.cash_on_hand === undefined || formData.cash_on_hand === null ? "" : formData.cash_on_hand}
                onChange={(e) => {
                  const v = e.target.value;
                  const num = v === "" ? 0 : parseFloat(v);
                  setFormData({
                    ...formData,
                    cash_on_hand: Number.isNaN(num) ? 0 : num,
                  });
                }}
              />
            </div>

            <div>
              <Label htmlFor="debt">Total Debt *</Label>
              <Input
                id="debt"
                type="number"
                step="0.01"
                min={0}
                value={formData.debt === undefined || formData.debt === null ? "" : formData.debt}
                onChange={(e) => {
                  const v = e.target.value;
                  const num = v === "" ? 0 : parseFloat(v);
                  setFormData({
                    ...formData,
                    debt: Number.isNaN(num) ? 0 : num,
                  });
                }}
              />
            </div>

            <div>
              <Label htmlFor="upcoming">Upcoming Payments (Optional)</Label>
              <Input
                id="upcoming"
                type="number"
                step="0.01"
                min={0}
                value={formData.upcoming_payments !== undefined && formData.upcoming_payments !== null ? formData.upcoming_payments : ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    upcoming_payments: e.target.value === "" ? null : (Number.isNaN(parseFloat(e.target.value)) ? null : parseFloat(e.target.value)),
                  })
                }
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="funding">Funding Structure *</Label>
              <Select
                value={formData.funding_structure || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, funding_structure: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select funding structure" />
                </SelectTrigger>
                <SelectContent>
                  {FUNDING_STRUCTURES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.funding_structure === "other" && (
                <div className="mt-3">
                  <Label htmlFor="funding-other">Please specify (optional)</Label>
                  <Input
                    id="funding-other"
                    value={formData.funding_structure_other || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        funding_structure_other: e.target.value,
                      })
                    }
                    placeholder="Describe your funding structure"
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="statements">Financial Statements *</Label>
              <Select
                value={formData.financial_statements || ""}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    financial_statements: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  {FINANCIAL_STATEMENTS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Systems Used *</Label>
              <div className="mt-2 space-y-2">
                {SYSTEMS.map((system) => (
                  <label
                    key={system.value}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.systems_used?.includes(system.value)}
                      onChange={() => toggleSystem(system.value)}
                      className="rounded"
                    />
                    <span>{system.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="unit">Unit Economics Visibility *</Label>
              <Select
                value={formData.unit_economics_visibility || ""}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    unit_economics_visibility: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select visibility level" />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_ECONOMICS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="industry">Industry *</Label>
              <Select
                value={formData.industry || ""}
                onValueChange={(value) => setFormData({ ...formData, industry: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Primary markets / regions *</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Select all that apply
              </p>
              <div className="space-y-2">
                {MARKETS.map((market) => (
                  <label
                    key={market.value}
                    className="flex items-start gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={formData.primary_markets?.includes(market.value)}
                      onChange={() => togglePrimaryMarket(market.value)}
                    />
                    <span>{market.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="fx">FX exposure *</Label>
              <Select
                value={formData.fx_exposure || ""}
                onValueChange={(value) => setFormData({ ...formData, fx_exposure: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select exposure" />
                </SelectTrigger>
                <SelectContent>
                  {FX_EXPOSURES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Top revenue streams *</Label>
              <p className="text-sm text-muted-foreground mb-2">
                List 1-5 key products/services
              </p>
              <div className="space-y-3">
                {formData.top_revenue_streams?.map((stream, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={stream}
                      onChange={(e) => updateRevenueStream(idx, e.target.value)}
                      placeholder={`Revenue stream ${idx + 1}`}
                    />
                    {formData.top_revenue_streams && formData.top_revenue_streams.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRevenueStream(idx)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={addRevenueStream}
                disabled={(formData.top_revenue_streams || []).length >= 5}
              >
                <Plus className="w-4 h-4 mr-1" /> Add stream
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dso">Average collection period (days) *</Label>
                <Input
                  id="dso"
                  type="number"
                  min={0}
                  max={365}
                  value={formData.avg_collection_period_days === undefined || formData.avg_collection_period_days === null ? "" : formData.avg_collection_period_days}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      avg_collection_period_days: Math.max(0, parseInt(e.target.value || "0", 10)),
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="overdue">% invoices overdue *</Label>
                <Input
                  id="overdue"
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={formData.overdue_invoices_percent === undefined || formData.overdue_invoices_percent === null ? "" : formData.overdue_invoices_percent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      overdue_invoices_percent: Math.min(
                        100,
                        Math.max(0, parseFloat(e.target.value || "0"))
                      ),
                    })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="inventory">Inventory posture *</Label>
              <Select
                value={formData.inventory_posture || ""}
                onValueChange={(value) => setFormData({ ...formData, inventory_posture: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  {INVENTORY_POSTURES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Credit facilities *</Label>
              <div className="mt-2 space-y-2">
                {CREDIT_FACILITIES.map((facility) => (
                  <label
                    key={facility.value}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.credit_facilities?.includes(facility.value)}
                      onChange={() => toggleCreditFacility(facility.value)}
                      className="rounded"
                    />
                    <span>{facility.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="risk">Risk appetite *</Label>
              <Select
                value={formData.risk_appetite || ""}
                onValueChange={(value) => setFormData({ ...formData, risk_appetite: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  {RISK_APPETITES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Preferred output focus *</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Select where you want the diagnostic to go deeper
              </p>
              <div className="space-y-2">
                {OUTPUT_FOCUS.map((focus) => (
                  <label
                    key={focus.value}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.preferred_output_focus?.includes(focus.value)}
                      onChange={() => toggleOutputFocus(focus.value)}
                      className="rounded"
                    />
                    <span>{focus.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
          >
            Back
          </Button>
          {step < TOTAL_STEPS ? (
            <Button onClick={() => setStep(step + 1)}>Next</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
  );
}

