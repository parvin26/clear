"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DiagnosticProgress } from "@/components/diagnostic/DiagnosticProgress";
import { DocumentUpload, type UploadedFile } from "@/components/diagnostic/DocumentUpload";
import { VoiceInputButton } from "@/components/ui/voice-input-button";
import { runDiagnosticRun } from "@/lib/clear-api";
import { getOnboardingContext } from "@/lib/onboarding-context";
import { Loader2 } from "lucide-react";

const TOTAL_STEPS = 9;

export function DiagnosticWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [operatingAndRevenue, setOperatingAndRevenue] = useState<"yes" | "no" | "">("");
  const [businessStage, setBusinessStage] = useState("");
  const [businessStageDropdown, setBusinessStageDropdown] = useState("");
  const [situationDescription, setSituationDescription] = useState("");
  const [primaryAreaAffected, setPrimaryAreaAffected] = useState("");
  const [situationClarifiers, setSituationClarifiers] = useState("");
  const [primaryTheme, setPrimaryTheme] = useState("");
  const [mostUrgent, setMostUrgent] = useState("");
  const [mostUrgentNotes, setMostUrgentNotes] = useState("");
  const [diagnosticGoal, setDiagnosticGoal] = useState("");
  const [diagnosticGoalNotes, setDiagnosticGoalNotes] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [decisionHorizon, setDecisionHorizon] = useState("");
  const [decisionHorizonDropdown, setDecisionHorizonDropdown] = useState("");

  const canNext = () => {
    if (step === 1) return operatingAndRevenue !== "";
    if (step === 2) return businessStage.trim().length > 0 || businessStageDropdown !== "";
    if (step === 3) return situationDescription.trim().length > 0 || primaryAreaAffected !== "";
    if (step === 4) return true;
    if (step === 5) return mostUrgent !== "";
    if (step === 6) return true;
    if (step === 7) return true; // document upload optional
    if (step === 8) return decisionHorizon.trim().length > 0 || decisionHorizonDropdown !== "";
    return true;
  };

  const handleNext = () => {
    if (step === 1 && operatingAndRevenue === "no") {
      router.push("/diagnostic/idea-stage");
      return;
    }
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      setError(null);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError(null);
    }
  };

  const buildDiagnosticData = (): Record<string, unknown> => ({
    operatingAndRevenue: operatingAndRevenue || "yes",
    businessStage: businessStage.trim() || businessStageDropdown || "operating business",
    businessStageDropdown: businessStageDropdown || undefined,
    situationDescription: situationDescription.trim() || "General capability diagnostic.",
    primaryAreaAffected: primaryAreaAffected || undefined,
    situationClarifiers: situationClarifiers.trim() ? situationClarifiers.split(/[,;]/).map((s) => s.trim()).filter(Boolean) : [],
    primaryTheme: primaryTheme || undefined,
    mostUrgent: mostUrgent || "fix_ops",
    mostUrgentNotes: mostUrgentNotes.trim() || undefined,
    diagnosticGoal: diagnosticGoal || "",
    diagnosticGoalNotes: diagnosticGoalNotes.trim() || undefined,
    documentNames: uploadedFiles.map((f) => f.file.name),
    decisionHorizon: decisionHorizon.trim() || decisionHorizonDropdown || "3 months",
    decisionHorizonDropdown: decisionHorizonDropdown || undefined,
    clarityLevel: "some_clarity",
    dataAvailable: ["qualitative"],
    riskLevel: "medium",
  });

  const handleGenerate = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const onboardingContext = getOnboardingContext();
      const diagnosticData = buildDiagnosticData();
      const res = await runDiagnosticRun({
        onboarding_context: (onboardingContext ?? undefined) as Record<string, unknown> | undefined,
        diagnostic_data: diagnosticData,
      });
      if (res.idea_stage) {
        router.push("/diagnostic/idea-stage");
        return;
      }
      if (res.decision_id) {
        router.push(`/diagnostic/result/${res.decision_id}`);
        return;
      }
      setError("No decision was created. Please try again.");
    } catch (e: unknown) {
      let msg: string | null = null;
      const err = e as {
        response?: { data?: { detail?: string | Array<{ msg?: string }>; message?: string }; status?: number };
        message?: string;
      };
      if (err?.response?.data) {
        const d = err.response.data.detail;
        if (typeof d === "string") msg = d;
        else if (Array.isArray(d) && d.length > 0) msg = d.map((x) => x?.msg ?? JSON.stringify(x)).join(". ");
        else if (typeof err.response.data.message === "string") msg = err.response.data.message;
      }
      if (!msg && (err?.response?.status === 0 || !err?.response))
        msg = "Cannot reach the server. Check that the backend is running on the correct port and CORS is allowed.";
      if (!msg && typeof err?.message === "string") msg = err.message;
      if (process.env.NODE_ENV === "development" && e) console.error("Diagnostic run error:", e);
      setError(msg || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-4 py-8 md:py-12">
      <div className="w-full max-w-xl mx-auto flex-1 flex flex-col">
        <DiagnosticProgress step={step} totalSteps={TOTAL_STEPS} />

          <div className="mt-8 space-y-6">
            {step === 1 && (
              <>
                <h2 className="text-xl font-semibold text-ink">Are you running an operating business?</h2>
                <p className="text-sm text-ink-muted">CLEAR works best when you already have revenue or active operations.</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="operating"
                      checked={operatingAndRevenue === "yes"}
                      onChange={() => setOperatingAndRevenue("yes")}
                      className="rounded-full border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="operating"
                      checked={operatingAndRevenue === "no"}
                      onChange={() => setOperatingAndRevenue("no")}
                      className="rounded-full border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium">No (idea or validation stage)</span>
                  </label>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-xl font-semibold text-ink">What stage is your business?</h2>
                <p className="text-sm text-ink-muted">Helps us tailor the plan to your context.</p>
                <div className="space-y-4">
                  <div>
                    <Label>Stage (select closest)</Label>
                    <Select value={businessStageDropdown} onValueChange={setBusinessStageDropdown}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pre_revenue">Pre-revenue / validating</SelectItem>
                        <SelectItem value="early_revenue">Early revenue (1–3 years)</SelectItem>
                        <SelectItem value="scaling">Scaling (3–5 years)</SelectItem>
                        <SelectItem value="growth">Growth (5+ years)</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessStage">Or describe in your own words *</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        id="businessStage"
                        placeholder="e.g. Early revenue, 5–20 people, scaling"
                        value={businessStage}
                        onChange={(e) => setBusinessStage(e.target.value)}
                        className="flex-1"
                      />
                      <VoiceInputButton
                        onTranscription={(text) => setBusinessStage((prev) => (prev ? `${prev} ${text}` : text))}
                        beforeText={businessStage}
                        aria-label="Speak to fill business stage"
                      />
                    </div>
                    <p className="text-xs text-ink-muted">You can type or use the mic to speak.</p>
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="text-xl font-semibold text-ink">What&apos;s going on right now?</h2>
                <p className="text-sm text-ink-muted">Describe your situation. What feels uncertain or stuck?</p>
                <div className="space-y-4">
                  <div>
                    <Label>Primary area affected (select)</Label>
                    <Select value={primaryAreaAffected} onValueChange={setPrimaryAreaAffected}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select area" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="finance">Finance / cash</SelectItem>
                        <SelectItem value="operations">Operations / process</SelectItem>
                        <SelectItem value="growth">Growth / demand</SelectItem>
                        <SelectItem value="tech">Technology / systems</SelectItem>
                        <SelectItem value="multiple">Multiple / not sure</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="situation">Describe in your own words *</Label>
                    <div className="flex gap-2 items-start">
                      <Textarea
                        id="situation"
                        placeholder="e.g. We're growing but cash is tight. We're not sure whether to focus on cutting costs or pushing for more revenue."
                        value={situationDescription}
                        onChange={(e) => setSituationDescription(e.target.value)}
                        rows={5}
                        className="resize-none flex-1"
                      />
                      <VoiceInputButton
                        onTranscription={(text) => setSituationDescription((prev) => (prev ? `${prev} ${text}` : text))}
                        beforeText={situationDescription}
                        aria-label="Speak to describe your situation"
                      />
                    </div>
                    <p className="text-xs text-ink-muted">You can type or use the mic to speak.</p>
                  </div>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h2 className="text-xl font-semibold text-ink">What else is relevant?</h2>
                <p className="text-sm text-ink-muted">Optional: key themes.</p>
                <div className="space-y-4">
                  <div>
                    <Label>Primary theme (select)</Label>
                    <Select value={primaryTheme} onValueChange={setPrimaryTheme}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash_flow">Cash flow</SelectItem>
                        <SelectItem value="hiring">Hiring / team</SelectItem>
                        <SelectItem value="fundraising">Fundraising</SelectItem>
                        <SelectItem value="product_market">Product-market fit</SelectItem>
                        <SelectItem value="supply_chain">Supply chain</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clarifiers">Or add themes in your own words (comma-separated)</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        id="clarifiers"
                        placeholder="e.g. cash flow, hiring, product-market fit"
                        value={situationClarifiers}
                        onChange={(e) => setSituationClarifiers(e.target.value)}
                        className="flex-1"
                      />
                      <VoiceInputButton
                        onTranscription={(text) => setSituationClarifiers((prev) => (prev ? `${prev}, ${text}` : text))}
                        beforeText={situationClarifiers}
                        aria-label="Speak to add themes"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <h2 className="text-xl font-semibold text-ink">What feels most urgent?</h2>
                <p className="text-sm text-ink-muted">We&apos;ll use this to prioritise the main domain.</p>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    {[
                      { value: "survive_cash", label: "Cash / runway" },
                      { value: "fix_ops", label: "Operations / process" },
                      { value: "grow_demand", label: "Growth / demand" },
                      { value: "tech", label: "Technology / systems" },
                    ].map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-border hover:bg-muted/50">
                        <input
                          type="radio"
                          name="mostUrgent"
                          checked={mostUrgent === opt.value}
                          onChange={() => setMostUrgent(opt.value)}
                          className="rounded-full border-border text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-medium">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  <div>
                    <Label htmlFor="mostUrgentNotes">Anything else about what&apos;s urgent? (optional)</Label>
                    <Textarea
                      id="mostUrgentNotes"
                      placeholder="Add more context if you like"
                      value={mostUrgentNotes}
                      onChange={(e) => setMostUrgentNotes(e.target.value)}
                      rows={2}
                      className="mt-1 resize-none"
                    />
                  </div>
                </div>
              </>
            )}

            {step === 6 && (
              <>
                <h2 className="text-xl font-semibold text-ink">What&apos;s your main goal for this decision?</h2>
                <p className="text-sm text-ink-muted">Helps focus the plan.</p>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    {[
                      { value: "improve_cash_flow", label: "Improve cash flow" },
                      { value: "scale_operations", label: "Scale operations" },
                      { value: "investor_ready", label: "Get investor ready" },
                      { value: "", label: "Just clarify and plan" },
                    ].map((opt) => (
                      <label key={opt.value || "none"} className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-border hover:bg-muted/50">
                        <input
                          type="radio"
                          name="goal"
                          checked={diagnosticGoal === opt.value}
                          onChange={() => setDiagnosticGoal(opt.value)}
                          className="rounded-full border-border text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-medium">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  <div>
                    <Label htmlFor="diagnosticGoalNotes">Anything else about your goal? (optional)</Label>
                    <Textarea
                      id="diagnosticGoalNotes"
                      placeholder="Add more context if you like"
                      value={diagnosticGoalNotes}
                      onChange={(e) => setDiagnosticGoalNotes(e.target.value)}
                      rows={2}
                      className="mt-1 resize-none"
                    />
                  </div>
                </div>
              </>
            )}

            {step === 7 && (
              <>
                <h2 className="text-xl font-semibold text-ink">Upload documents for assessment (optional)</h2>
                <p className="text-sm text-ink-muted">e.g. audit reports, financial statements, current reports. We&apos;ll use them to enrich your snapshot.</p>
                <DocumentUpload files={uploadedFiles} onFilesChange={setUploadedFiles} />
              </>
            )}

            {step === 8 && (
              <>
                <h2 className="text-xl font-semibold text-ink">What&apos;s your decision horizon?</h2>
                <p className="text-sm text-ink-muted">When do you need to see results or make the call?</p>
                <div className="space-y-4">
                  <div>
                    <Label>Time horizon (select)</Label>
                    <Select value={decisionHorizonDropdown} onValueChange={setDecisionHorizonDropdown}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select horizon" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1_month">1 month</SelectItem>
                        <SelectItem value="3_months">3 months</SelectItem>
                        <SelectItem value="6_months">6 months</SelectItem>
                        <SelectItem value="12_months">12 months</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="horizon">Or describe in your own words *</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        id="horizon"
                        placeholder="e.g. 3 months, this quarter"
                        value={decisionHorizon}
                        onChange={(e) => setDecisionHorizon(e.target.value)}
                        className="flex-1"
                      />
                      <VoiceInputButton
                        onTranscription={(text) => setDecisionHorizon((prev) => (prev ? `${prev} ${text}` : text))}
                        beforeText={decisionHorizon}
                        aria-label="Speak to fill decision horizon"
                      />
                    </div>
                    <p className="text-xs text-ink-muted">You can type or use the mic to speak.</p>
                  </div>
                </div>
              </>
            )}

            {step === 9 && (
              <>
                <h2 className="text-xl font-semibold text-ink">Ready to generate your snapshot</h2>
                <p className="text-sm text-ink-muted leading-relaxed">
                  We&apos;ll classify your situation and create a decision record. Next, you&apos;ll see a snapshot and three options: playbooks, AI advisor, or human review.
                </p>
                {error && (
                  <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">{error}</p>
                )}
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    "Generate my decision snapshot"
                  )}
                </Button>
              </>
            )}
          </div>

          {step < 9 && (
            <div className="mt-10 flex justify-between">
              <Button variant="ghost" onClick={handleBack} disabled={step === 1} asChild={step === 1}>
                {step === 1 ? <Link href="/diagnostic">Back</Link> : <span>Back</span>}
              </Button>
              <Button onClick={handleNext} disabled={!canNext()}>
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
  );
}
