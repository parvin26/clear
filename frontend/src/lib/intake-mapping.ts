/**
 * Map intake answers to backend contract: onboarding_context and diagnostic_data.
 * Used by the conversational intake before calling runDiagnosticRun.
 */

import type { OnboardingContext } from "./onboarding-context";
import type {
  DiagnosticDataOut,
  FounderAnswers,
  IntakeIdentity,
  MSMEAnswers,
  Role,
  UnifiedIntakeAnswers,
} from "./intake-types";
import { ROLE_FOUNDER, ROLE_MSME } from "./intake-types";

/**
 * Map identity step to existing onboarding_context shape so backend and
 * runDiagnosticRun remain unchanged.
 */
export function identityToOnboardingContext(identity: IntakeIdentity): OnboardingContext {
  return {
    company_name: identity.organization_name || undefined,
    country: identity.country || undefined,
    industry: identity.sector || undefined,
    company_size_band: identity.org_size_band || undefined,
    email: identity.contact_email || undefined,
  };
}

/**
 * Map unified intake answers to diagnostic_data for POST /api/clear/diagnostic/run.
 * For role === 'impact_investor' the caller must NOT call runDiagnosticRun; use answers.investor_profile instead.
 */
export function intakeAnswersToDiagnosticData(
  role: Role,
  answers: UnifiedIntakeAnswers
): DiagnosticDataOut {
  if (role === ROLE_MSME && answers.msme) {
    return msmeToDiagnosticData(answers.msme);
  }
  if (role === "startup_founder" && answers.founder) {
    return founderToDiagnosticData(answers.founder);
  }
  if (role === "social_enterprise_leader" && answers.founder) {
    const base = founderToDiagnosticData(answers.founder);
    base.intake_version = "conversational_v1";
    if (answers.impact_profile) {
      base.impact_profile = answers.impact_profile;
    }
    return base;
  }
  // impact_investor: caller should not use this for run; persist investor_profile separately
  return {
    situationDescription: "Impact investor profile (no diagnostic run).",
    situationClarifiers: [],
  };
}

function founderToDiagnosticData(f: FounderAnswers): DiagnosticDataOut {
  const situationClarifiers = Array.isArray(f.situationClarifiers)
    ? f.situationClarifiers
    : typeof f.situationClarifiers === "string"
      ? (f.situationClarifiers as string)
          .split(/[,;]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
  return {
    intake_version: "conversational_v1",
    operatingAndRevenue: f.operatingAndRevenue || "yes",
    businessStage: (f.businessStage || "").trim() || f.businessStageDropdown || "operating business",
    businessStageDropdown: f.businessStageDropdown || undefined,
    situationDescription: (f.situationDescription || "").trim() || "General capability diagnostic.",
    primaryAreaAffected: f.primaryAreaAffected || undefined,
    situationClarifiers,
    primaryTheme: f.primaryTheme || undefined,
    mostUrgent: f.mostUrgent || "fix_ops",
    mostUrgentNotes: (f.mostUrgentNotes || "").trim() || undefined,
    diagnosticGoal: f.diagnosticGoal ?? "",
    diagnosticGoalNotes: (f.diagnosticGoalNotes || "").trim() || undefined,
    documentNames: f.documentNames || [],
    decisionHorizon: (f.decisionHorizon || "").trim() || f.decisionHorizonDropdown || "3 months",
    decisionHorizonDropdown: f.decisionHorizonDropdown || undefined,
    clarityLevel: "some_clarity",
    dataAvailable: ["qualitative"],
    riskLevel: "medium",
  };
}

function msmeToDiagnosticData(m: MSMEAnswers): DiagnosticDataOut {
  const parts: string[] = [];
  if (m.challenges.length > 0) {
    parts.push(`MSME assessment: ${m.challenges.join(", ")}.`);
  }
  const notes = (m.challengesNotes || "").trim();
  if (notes) parts.push(notes);
  const priority = (m.priority_sentence || "").trim();
  if (priority) parts.push(priority);
  if (m.years_operating) parts.push(`Operating: ${m.years_operating}.`);
  if (m.primary_constraint) parts.push(`Constraint: ${m.primary_constraint}.`);
  if (m.demand_sentiment) parts.push(`Demand: ${m.demand_sentiment}.`);

  const situationDescription =
    parts.length > 0 ? parts.join(" ").trim() : "MSME capability diagnostic.";

  const out: DiagnosticDataOut = {
    intake_version: "conversational_v1",
    flow: "msme",
    challenges: m.challenges,
    challengesNotes: (m.challengesNotes || "").trim() || undefined,
    primaryFocus: m.primaryFocus || undefined,
    primaryFocusNotes: (m.primaryFocusNotes || "").trim() || undefined,
    documentNames: m.documentNames || [],
    operatingAndRevenue: "yes",
    situationDescription,
  };
  if (m.decision_horizon) {
    out.decisionHorizon = m.decision_horizon;
  }
  return out;
}
