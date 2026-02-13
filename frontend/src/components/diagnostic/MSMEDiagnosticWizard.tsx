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
import { runDiagnosticRun } from "@/lib/clear-api";
import { getOnboardingContext } from "@/lib/onboarding-context";
import { Loader2, Check } from "lucide-react";

const CHALLENGE_OPTIONS = [
  { value: "cash_tight", label: "Cash feels tight or unpredictable" },
  { value: "customers_late", label: "Customers are paying late or not paying" },
  { value: "sales_declining", label: "Sales are declining or unstable" },
  { value: "costs_rising", label: "Costs are rising faster than revenue" },
  { value: "decisions_on_me", label: "Too many decisions depend on me" },
  { value: "ops_messy", label: "Operations feel messy or fragile" },
  { value: "not_sure", label: "I'm not sure — it's complicated" },
];

const TOTAL_STEPS = 4;

export function MSMEDiagnosticWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [challenges, setChallenges] = useState<string[]>([]);
  const [challengesNotes, setChallengesNotes] = useState("");
  const [primaryFocus, setPrimaryFocus] = useState("");
  const [primaryFocusNotes, setPrimaryFocusNotes] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const toggleChallenge = (value: string) => {
    setChallenges((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
    );
  };

  const canNext = () => {
    if (step === 1) return challenges.length > 0;
    if (step === 2) return true;
    if (step === 3) return true;
    return true;
  };

  const handleNext = () => {
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
    flow: "msme",
    challenges,
    challengesNotes: challengesNotes.trim() || undefined,
    primaryFocus: primaryFocus || undefined,
    primaryFocusNotes: primaryFocusNotes.trim() || undefined,
    documentNames: uploadedFiles.map((f) => f.file.name),
    operatingAndRevenue: "yes",
    situationDescription: challenges.length
      ? `MSME assessment: ${challenges.join(", ")}. ${challengesNotes.trim() || ""}`.trim()
      : "MSME capability diagnostic.",
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
    } catch (e) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof msg === "string" ? msg : "Something went wrong. Please try again.");
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
              <p className="text-sm text-ink-muted">We want to make sure we understand the situation correctly.</p>
              <h2 className="text-xl font-semibold text-ink">
                Based on what you shared, which of these feel most true right now?
              </h2>
              <div className="grid gap-2">
                {CHALLENGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleChallenge(opt.value)}
                    className={`flex items-center justify-between gap-2 p-3 rounded-lg border text-left transition-colors ${
                      challenges.includes(opt.value)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <span className="text-sm font-medium">{opt.label}</span>
                    {challenges.includes(opt.value) && (
                      <Check className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                    )}
                  </button>
                ))}
              </div>
              <div>
                <Label htmlFor="challengesNotes">Anything else? (optional)</Label>
                <Textarea
                  id="challengesNotes"
                  placeholder="Add context in your own words"
                  value={challengesNotes}
                  onChange={(e) => setChallengesNotes(e.target.value)}
                  rows={3}
                  className="mt-1 resize-none"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-semibold text-ink">Where do you want to focus first?</h2>
              <p className="text-sm text-ink-muted">We&apos;ll use this to prioritise the main area.</p>
              <div className="space-y-4">
                <div>
                  <Label>Primary focus (select)</Label>
                  <Select value={primaryFocus} onValueChange={setPrimaryFocus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select area" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cfo">Finance / cash</SelectItem>
                      <SelectItem value="cmo">Growth / marketing</SelectItem>
                      <SelectItem value="coo">Operations</SelectItem>
                      <SelectItem value="cto">Technology</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="primaryFocusNotes">Describe in your own words (optional)</Label>
                  <Textarea
                    id="primaryFocusNotes"
                    placeholder="What would help most right now?"
                    value={primaryFocusNotes}
                    onChange={(e) => setPrimaryFocusNotes(e.target.value)}
                    rows={3}
                    className="mt-1 resize-none"
                  />
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-xl font-semibold text-ink">Upload documents for assessment (optional)</h2>
              <p className="text-sm text-ink-muted">
                e.g. audit reports, financial statements, current reports.
              </p>
              <DocumentUpload files={uploadedFiles} onFilesChange={setUploadedFiles} />
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="text-xl font-semibold text-ink">Ready to generate your snapshot</h2>
              <p className="text-sm text-ink-muted leading-relaxed">
                We&apos;ll create a decision record and next you can use the AI advisor and speak with the relevant CXO agents.
              </p>
              {error && (
                <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">
                  {error}
                </p>
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

        {step < TOTAL_STEPS && (
          <div className="mt-10 flex justify-between">
            <Button variant="ghost" onClick={handleBack} disabled={step === 1} asChild={step === 1}>
              {step === 1 ? <Link href="/diagnostic">Back</Link> : <span>Back</span>}
            </Button>
            <Button onClick={handleNext} disabled={!canNext()}>
              Continue
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
