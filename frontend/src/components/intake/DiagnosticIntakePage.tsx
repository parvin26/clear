"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shell } from "@/components/layout/Shell";
import { IntakeProgressBar } from "@/components/intake/IntakeProgressBar";
import { StepIdentity } from "@/components/intake/StepIdentity";
import { StepRoleSelect } from "@/components/intake/StepRoleSelect";
import { StepFounderQuestions } from "@/components/intake/StepFounderQuestions";
import { StepMSMEQuestions } from "@/components/intake/StepMSMEQuestions";
import { StepImpactAddOn } from "@/components/intake/StepImpactAddOn";
import { StepInvestorProfile } from "@/components/intake/StepInvestorProfile";
import { identityToOnboardingContext } from "@/lib/intake-mapping";
import { intakeAnswersToDiagnosticData } from "@/lib/intake-mapping";
import { setOnboardingContext, getOnboardingContext } from "@/lib/onboarding-context";
import {
  type IntakeIdentity,
  type Role,
  type FounderAnswers,
  type MSMEAnswers,
  type ImpactProfileSeed,
  type InvestorProfile,
  type StepId,
  type UnifiedIntakeAnswers,
  getStepSequence,
  IMPACT_ADDON_STEP_IDS,
  ROLES_WITH_DIAGNOSTIC_RUN,
} from "@/lib/intake-types";
import { INTAKE_COUNTRIES, INTAKE_SECTORS, sdgThemesToImpactCategories } from "@/lib/intake-constants";
import { runDiagnosticRun, submitInvestorProfile } from "@/lib/clear-api";
import { trackEvent } from "@/lib/analytics";
import { Loader2 } from "lucide-react";
import type { UploadedFile } from "@/components/diagnostic/DocumentUpload";

const INTAKE_SESSION_KEY = "clear_intake_session";

const INITIAL_IDENTITY: Partial<IntakeIdentity> = {
  organization_name: "",
  country: "",
  sector: "",
};

const ROLE_QUERY_ALIASES: Record<string, Role> = {
  startup_founder: "startup_founder",
  founder: "startup_founder",
  raising: "startup_founder",
  msme_owner: "msme_owner",
  enterprise: "msme_owner",
  msme: "msme_owner",
  sme: "msme_owner",
  social_enterprise_leader: "social_enterprise_leader",
  social_enterprise: "social_enterprise_leader",
  impact_investor: "impact_investor",
  investor: "impact_investor",
};

function normalizeRoleQueryParam(value: string | null): Role | null {
  if (!value) return null;
  const normalized = ROLE_QUERY_ALIASES[value.trim().toLowerCase()];
  return normalized ?? null;
}

function loadSession(): Partial<{
  identity: Partial<IntakeIdentity>;
  role: Role | null;
  stepIndex: number;
  founder: Partial<FounderAnswers> & { uploadedFiles?: UploadedFile[] };
  msme: Partial<MSMEAnswers> & { uploadedFiles?: UploadedFile[] };
  impact_profile: Partial<ImpactProfileSeed>;
  investor_profile: Partial<InvestorProfile>;
}> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(INTAKE_SESSION_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ReturnType<typeof loadSession>;
  } catch {
    return {};
  }
}

function saveSession(state: {
  identity: Partial<IntakeIdentity>;
  role: Role | null;
  stepIndex: number;
  founder: Partial<FounderAnswers> & { uploadedFiles?: UploadedFile[] };
  msme: Partial<MSMEAnswers> & { uploadedFiles?: UploadedFile[] };
  impact_profile: Partial<ImpactProfileSeed>;
  investor_profile: Partial<InvestorProfile>;
}) {
  if (typeof window === "undefined") return;
  try {
    const toSave = {
      ...state,
      founder: state.founder ? { ...state.founder, uploadedFiles: undefined } : state.founder,
      msme: state.msme ? { ...state.msme, uploadedFiles: undefined } : state.msme,
    };
    sessionStorage.setItem(INTAKE_SESSION_KEY, JSON.stringify(toSave));
  } catch (_) {}
}

export function DiagnosticIntakePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identity, setIdentity] = useState<Partial<IntakeIdentity>>(INITIAL_IDENTITY);
  const [role, setRole] = useState<Role | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [founder, setFounder] = useState<Partial<FounderAnswers> & { uploadedFiles?: UploadedFile[] }>({});
  const [msme, setMsme] = useState<Partial<MSMEAnswers> & { uploadedFiles?: UploadedFile[] }>({});
  const [impactProfile, setImpactProfile] = useState<Partial<ImpactProfileSeed>>({});
  const [investorProfile, setInvestorProfile] = useState<Partial<InvestorProfile>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInvestorResult, setShowInvestorResult] = useState(false);
  const [identityTouched, setIdentityTouched] = useState(false);
  const [roleTouched, setRoleTouched] = useState(false);

  const roleStepSequence = role ? getStepSequence(role) : [];
  const totalSteps = 2 + roleStepSequence.length;
  const currentStepNumber = stepIndex + 1;

  const roleParam = searchParams.get("role");
  useEffect(() => {
    const s = loadSession();
    if (s.identity && (s.identity.organization_name || s.identity.country || s.identity.sector)) {
      setIdentity((prev) => ({ ...INITIAL_IDENTITY, ...prev, ...s.identity }));
    }
    if (s.founder && Object.keys(s.founder).length > 0) setFounder((prev) => ({ ...prev, ...s.founder }));
    if (s.msme && Object.keys(s.msme).length > 0) setMsme((prev) => ({ ...prev, ...s.msme }));
    if (s.impact_profile && Object.keys(s.impact_profile).length > 0) setImpactProfile((prev) => ({ ...prev, ...s.impact_profile }));
    if (s.investor_profile && Object.keys(s.investor_profile).length > 0) setInvestorProfile((prev) => ({ ...prev, ...s.investor_profile }));

    const queryRole = normalizeRoleQueryParam(roleParam);
    if (queryRole) {
      setRole(queryRole);
      if (typeof s.stepIndex === "number" && s.stepIndex >= 0) setStepIndex(s.stepIndex);
      return;
    }

    if (s.role) {
      setRole(s.role);
      if (typeof s.stepIndex === "number" && s.stepIndex >= 0) {
        setStepIndex(s.stepIndex);
      }
      return;
    }

    setStepIndex(0);
    setRole(null);
  }, [roleParam]);

  useEffect(() => {
    saveSession({
      identity,
      role,
      stepIndex,
      founder,
      msme,
      impact_profile: impactProfile,
      investor_profile: investorProfile,
    });
  }, [identity, role, stepIndex, founder, msme, impactProfile, investorProfile]);

  const canProceedIdentity = Boolean(
    identity.organization_name?.trim() &&
      identity.country &&
      identity.sector
  );

  const canProceedRole = role !== null && (ROLES_WITH_DIAGNOSTIC_RUN.includes(role) || role === "impact_investor");

  const currentRoleStepId = stepIndex >= 2 ? roleStepSequence[stepIndex - 2] : null;

  const canProceedFounderStep = useCallback(
    (stepId: StepId): boolean => {
      if (stepId === "founder_operating") return (founder.operatingAndRevenue ?? "") !== "";
      if (stepId === "founder_stage")
        return Boolean((founder.businessStage ?? "").trim() || founder.businessStageDropdown);
      if (stepId === "founder_situation")
        return Boolean((founder.situationDescription ?? "").trim() || founder.primaryAreaAffected);
      if (stepId === "founder_themes") return true;
      if (stepId === "founder_urgency") return Boolean(founder.mostUrgent);
      if (stepId === "founder_goal") return true;
      if (stepId === "founder_docs") return true;
      if (stepId === "founder_horizon")
        return Boolean((founder.decisionHorizon ?? "").trim() || founder.decisionHorizonDropdown);
      return true;
    },
    [founder]
  );

  const canProceedMSMEStep = useCallback(
    (stepId: StepId): boolean => {
      if (stepId === "msme_challenges") return (msme.challenges ?? []).length > 0;
      return true;
    },
    [msme]
  );

  const canProceedImpactStep = useCallback(
    (stepId: StepId): boolean => {
      if (stepId === "impact_categories") {
        const c = impactProfile.categories ?? [];
        return c.length >= 2 && c.length <= 4;
      }
      return true;
    },
    [impactProfile]
  );

  const canProceedInvestorStep = useCallback(
    (stepId: StepId): boolean => {
      if (stepId === "investor_stage") return Boolean(investorProfile.portfolio_stage);
      return true;
    },
    [investorProfile]
  );

  const canProceedCurrentStep =
    stepIndex === 0
      ? canProceedIdentity
      : stepIndex === 1
        ? canProceedRole
        : currentRoleStepId === "submit"
          ? true
          : role === "startup_founder"
            ? canProceedFounderStep(currentRoleStepId!)
            : role === "msme_owner"
              ? canProceedMSMEStep(currentRoleStepId!)
              : role === "social_enterprise_leader"
                ? IMPACT_ADDON_STEP_IDS.includes(currentRoleStepId!)
                  ? canProceedImpactStep(currentRoleStepId!)
                  : canProceedFounderStep(currentRoleStepId!)
                : role === "impact_investor"
                  ? canProceedInvestorStep(currentRoleStepId!)
                  : true;

  const handleNext = () => {
    if (stepIndex === 0) {
      setIdentityTouched(true);
      if (!canProceedIdentity) return;
      trackEvent("diagnostic_intake_started", {
        intake_version: "conversational_v1",
        source: searchParams.get("source") ?? undefined,
      });
    }
    if (stepIndex === 1) {
      setRoleTouched(true);
      if (!canProceedRole) return;
      if (role) trackEvent("diagnostic_role_selected", { role, intake_version: "conversational_v1", source: searchParams.get("source") ?? undefined });
    }
    if (stepIndex >= 2 && currentRoleStepId !== "submit") {
      if (role === "startup_founder" && !canProceedFounderStep(currentRoleStepId!)) return;
      if (role === "msme_owner" && !canProceedMSMEStep(currentRoleStepId!)) return;
      if (role === "social_enterprise_leader") {
        if (IMPACT_ADDON_STEP_IDS.includes(currentRoleStepId!)) {
          if (!canProceedImpactStep(currentRoleStepId!)) return;
        } else if (!canProceedFounderStep(currentRoleStepId!)) return;
      }
      if (role === "impact_investor" && !canProceedInvestorStep(currentRoleStepId!)) return;
    }
    if (currentRoleStepId === "submit") return;
    setStepIndex((i) => i + 1);
    setError(null);
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!role) return;

    if (role === "impact_investor") {
      setSubmitting(true);
      setError(null);
      try {
        const onboardingContext = identityToOnboardingContext(identity as IntakeIdentity);
        setOnboardingContext(onboardingContext);
        const sdgThemes = investorProfile.sdg_themes ?? [];
        const themes =
          sdgThemes.length > 0
            ? sdgThemesToImpactCategories(sdgThemes)
            : (investorProfile.themes ?? []);
        await submitInvestorProfile({
          onboarding_context: getOnboardingContext() as Record<string, unknown> | undefined,
          investor_profile: {
            regions: investorProfile.regions ?? undefined,
            sectors: investorProfile.sectors ?? [],
            geographies: investorProfile.geographies ?? [],
            themes,
            sdg_themes: sdgThemes.length > 0 ? sdgThemes : undefined,
            portfolio_stage: (investorProfile.portfolio_stage ?? "evaluating_opportunities") as InvestorProfile["portfolio_stage"],
            primary_needs: investorProfile.primary_needs ?? [],
            other_sector_notes: investorProfile.other_sector_notes ?? undefined,
          },
        });
        setShowInvestorResult(true);
        trackEvent("diagnostic_intake_completed", { role: "impact_investor", intake_version: "conversational_v1", source: searchParams.get("source") ?? undefined });
      } catch (e: unknown) {
        if (process.env.NODE_ENV === "development") {
          const err = e as { response?: { status?: number; data?: unknown } };
          const status = err?.response?.status;
          const body = err?.response?.data;
          console.error("[Investor submit] POST /api/intake/investor-profile failed:", { status, body });
        }
        setError(
          "We couldn't save your investor profile. Please check your connection and try again. If the error persists, contact us at hello@clearcommons.com."
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!ROLES_WITH_DIAGNOSTIC_RUN.includes(role)) return;
    setSubmitting(true);
    setError(null);
    try {
      const onboardingContext = identityToOnboardingContext(identity as IntakeIdentity);
      setOnboardingContext(onboardingContext);

      const answers: UnifiedIntakeAnswers = {
        identity: identity as IntakeIdentity,
        role,
        founder:
          role === "startup_founder" || role === "social_enterprise_leader"
            ? {
                operatingAndRevenue: founder.operatingAndRevenue ?? "yes",
                businessStage: founder.businessStage ?? "",
                businessStageDropdown: founder.businessStageDropdown,
                situationDescription: founder.situationDescription ?? "",
                primaryAreaAffected: founder.primaryAreaAffected,
                situationClarifiers: Array.isArray(founder.situationClarifiers)
                  ? founder.situationClarifiers
                  : [],
                primaryTheme: founder.primaryTheme,
                mostUrgent: founder.mostUrgent ?? "fix_ops",
                mostUrgentNotes: founder.mostUrgentNotes,
                diagnosticGoal: founder.diagnosticGoal ?? "",
                diagnosticGoalNotes: founder.diagnosticGoalNotes,
                documentNames: founder.documentNames ?? founder.uploadedFiles?.map((f) => f.file.name) ?? [],
                decisionHorizon: founder.decisionHorizon ?? "",
                decisionHorizonDropdown: founder.decisionHorizonDropdown,
              }
            : undefined,
        msme: role === "msme_owner" ? {
          challenges: msme.challenges ?? [],
          challengesNotes: msme.challengesNotes,
          years_operating: msme.years_operating,
          primary_constraint: msme.primary_constraint,
          demand_sentiment: msme.demand_sentiment,
          decision_horizon: msme.decision_horizon,
          priority_sentence: msme.priority_sentence,
          primaryFocus: msme.primaryFocus,
          primaryFocusNotes: msme.primaryFocusNotes,
          documentNames: msme.documentNames ?? msme.uploadedFiles?.map((f) => f.file.name) ?? [],
        } : undefined,
        impact_profile: role === "social_enterprise_leader" && (impactProfile.categories?.length ?? 0) > 0
          ? {
              categories: impactProfile.categories ?? [],
              metric_focus_areas: impactProfile.metric_focus_areas ?? [],
              tracking_existing: impactProfile.tracking_existing ?? false,
              tracking_notes: impactProfile.tracking_notes,
              seeking_impact_capital: impactProfile.seeking_impact_capital ?? false,
            }
          : undefined,
      };

      const diagnosticData = intakeAnswersToDiagnosticData(role, answers);
      const res = await runDiagnosticRun({
        onboarding_context: getOnboardingContext() as Record<string, unknown> | undefined,
        diagnostic_data: diagnosticData as Record<string, unknown>,
      });

      if (res.idea_stage) {
        router.push("/diagnostic/idea-stage");
        return;
      }
      if (res.decision_id) {
        trackEvent("diagnostic_intake_completed", { role, decision_id: res.decision_id, intake_version: "conversational_v1", source: searchParams.get("source") ?? undefined });
        const isSocialEnterprise = role === "social_enterprise_leader";
        router.push(`/diagnostic/result/${res.decision_id}${isSocialEnterprise ? "?social_enterprise=1" : ""}`);
        return;
      }
      setError("No decision was created. Please try again.");
    } catch (e: unknown) {
      const err = e as {
        response?: { data?: { detail?: string | Array<{ msg?: string }>; message?: string } };
        message?: string;
      };
      let msg: string | null = null;
      if (err?.response?.data) {
        const d = err.response.data.detail;
        if (typeof d === "string") msg = d;
        else if (Array.isArray(d) && d.length > 0)
          msg = d.map((x) => x?.msg ?? JSON.stringify(x)).join(". ");
        else if (typeof err.response.data.message === "string") msg = err.response.data.message;
      }
      if (!msg && typeof err?.message === "string") msg = err.message;
      setError(msg || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (showInvestorResult) {
    return (
      <Shell>
        <div className="min-h-[60vh] flex flex-col px-4 py-8 md:py-12">
          <div className="w-full max-w-xl mx-auto flex-1 flex flex-col">
            <h2 className="text-xl font-semibold text-ink mb-2">Portfolio dashboards are coming soon</h2>
            <p className="text-ink-muted mb-6">
              We&apos;ve saved your investment thesis and primary needs. We&apos;ll use your investor_profile to shape CLEAR&apos;s portfolio view and impact reporting for capital partners. Book a call or join early access to be first in line.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/contact">Book a call</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/contact">Join early access</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/">Back to home</Link>
              </Button>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="min-h-[60vh] flex flex-col px-4 py-8 md:py-12">
        <div className="w-full max-w-xl mx-auto flex-1 flex flex-col">
          <div className="mb-6">
            <h1 className="text-xl md:text-2xl font-semibold text-ink">CLEAR Diagnostic (New Conversational Flow)</h1>
            <p className="text-sm text-ink-muted mt-1">Single, guided intake for founders, MSMEs, and social enterprises.</p>
          </div>

          <IntakeProgressBar step={currentStepNumber} totalSteps={totalSteps} />

          <div className="mt-8 space-y-6">
            {stepIndex === 0 && (
              <>
                <StepIdentity value={identity} onChange={setIdentity} />
                {identityTouched && !canProceedIdentity && (
                  <p className="text-sm text-danger" role="alert">Please fill in organization name, country, and sector.</p>
                )}
              </>
            )}

            {stepIndex === 1 && (
              <>
                <StepRoleSelect value={role} onChange={setRole} />
                {roleTouched && !canProceedRole && (
                  <p className="text-sm text-danger" role="alert">Please choose a role to continue.</p>
                )}
              </>
            )}

            {stepIndex >= 2 && (role === "startup_founder" || role === "social_enterprise_leader") && currentRoleStepId && currentRoleStepId !== "submit" && !IMPACT_ADDON_STEP_IDS.includes(currentRoleStepId) && (
              <StepFounderQuestions
                stepId={currentRoleStepId}
                value={founder}
                onChange={setFounder}
              />
            )}

            {stepIndex >= 2 && role === "social_enterprise_leader" && currentRoleStepId && IMPACT_ADDON_STEP_IDS.includes(currentRoleStepId) && currentRoleStepId !== "submit" && (
              <StepImpactAddOn stepId={currentRoleStepId} value={impactProfile} onChange={setImpactProfile} />
            )}

            {stepIndex >= 2 && role === "msme_owner" && currentRoleStepId && currentRoleStepId !== "submit" && (
              <StepMSMEQuestions stepId={currentRoleStepId} value={msme} onChange={setMsme} />
            )}

            {stepIndex >= 2 && role === "impact_investor" && currentRoleStepId && currentRoleStepId !== "submit" && (
              <StepInvestorProfile stepId={currentRoleStepId} value={investorProfile} onChange={setInvestorProfile} />
            )}

            {currentRoleStepId === "submit" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-ink">
                  {role === "impact_investor" ? "Submit your profile" : "Ready to generate your snapshot"}
                </h2>
                <p className="text-sm text-ink-muted leading-relaxed">
                  {role === "impact_investor"
                    ? "We'll use your thesis and needs to shape CLEAR's portfolio tools. You'll see a confirmation and ways to stay in touch."
                    : "We'll classify your situation and create a decision record. Next, you'll see a snapshot and options: playbooks, AI advisor, or human review."}
                </p>
                {role === "impact_investor" && (
                  <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                    <h3 className="text-sm font-medium text-ink">Review your organization details</h3>
                    <dl className="text-sm text-ink-muted space-y-1">
                      <div><dt className="inline font-medium text-ink">Organization:</dt> <dd className="inline">{identity.organization_name || "—"}</dd></div>
                      <div><dt className="inline font-medium text-ink">Country:</dt> <dd className="inline">{INTAKE_COUNTRIES.find((c) => c.value === identity.country)?.label ?? identity.country ?? "—"}</dd></div>
                      <div><dt className="inline font-medium text-ink">Sector:</dt> <dd className="inline">{INTAKE_SECTORS.find((s) => s.value === identity.sector)?.label ?? identity.sector ?? "—"}</dd></div>
                      {identity.contact_email && (
                        <div><dt className="inline font-medium text-ink">Contact email:</dt> <dd className="inline">{identity.contact_email}</dd></div>
                      )}
                    </dl>
                    <Button variant="link" className="h-auto p-0 text-primary font-medium" onClick={() => setStepIndex(0)}>
                      Edit
                    </Button>
                  </div>
                )}
                {error && (
                  <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {role === "impact_investor" ? "Submitting…" : "Generating…"}
                    </>
                  ) : role === "impact_investor"
                    ? "Submit profile"
                    : "Generate my decision snapshot"}
                </Button>
              </div>
            )}
          </div>

          {currentRoleStepId !== "submit" && (
            <div className="mt-10 flex justify-between">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={stepIndex === 0}
                asChild={stepIndex === 0}
              >
                {stepIndex === 0 ? (
                  <Link href="/">Back</Link>
                ) : (
                  <span>Back</span>
                )}
              </Button>
              <Button onClick={handleNext} disabled={!canProceedCurrentStep}>
                Next
              </Button>
            </div>
          )}

          <div className="mt-12 pt-6 border-t border-border text-center space-y-2">
            <p className="text-xs text-ink-muted">
              Prefer the previous step-by-step forms? Use the legacy wizards below.
            </p>
            <p className="text-xs text-ink-muted">
              Prefer a single area?{" "}
              <Link href="/book-diagnostic" className="font-medium text-primary hover:underline">
                Choose Finance, Growth, Ops, or Tech
              </Link>
              . Legacy:{" "}
              <Link
                href="/diagnostic/run"
                className="font-medium text-primary hover:underline"
                onClick={() => trackEvent("diagnostic_legacy_wizard_clicked", { label: "founder" })}
              >
                Founder wizard
              </Link>
              {" · "}
              <Link
                href="/diagnostic/msme"
                className="font-medium text-primary hover:underline"
                onClick={() => trackEvent("diagnostic_legacy_wizard_clicked", { label: "msme" })}
              >
                MSME wizard
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </Shell>
  );
}
