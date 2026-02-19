/**
 * Mapping tests: intakeAnswersToDiagnosticData must produce the same diagnostic_data
 * shape as legacy wizards for founder and MSME; social enterprise must include impact_profile.
 */

import { intakeAnswersToDiagnosticData } from "./intake-mapping";
import type {
  FounderAnswers,
  MSMEAnswers,
  ImpactProfileSeed,
  UnifiedIntakeAnswers,
} from "./intake-types";

/** Simulated founder answers matching legacy wizard state. */
const LEGACY_FOUNDER_ANSWERS: FounderAnswers = {
  operatingAndRevenue: "yes",
  businessStage: "Early revenue, 5 people",
  businessStageDropdown: "early_revenue",
  situationDescription: "We're growing but cash is tight. Not sure whether to focus on cutting costs or pushing revenue.",
  primaryAreaAffected: "finance",
  situationClarifiers: ["cash flow", "hiring"],
  primaryTheme: "cash_flow",
  mostUrgent: "survive_cash",
  mostUrgentNotes: "Runway under 6 months",
  diagnosticGoal: "improve_cash_flow",
  diagnosticGoalNotes: "",
  documentNames: ["pitch.pdf"],
  decisionHorizon: "3 months",
  decisionHorizonDropdown: "3_months",
};

const UNIFIED: UnifiedIntakeAnswers = {
  identity: {
    organization_name: "Acme Ltd",
    country: "US",
    sector: "tech",
  },
  role: "startup_founder",
  founder: LEGACY_FOUNDER_ANSWERS,
};

/** Expected shape from legacy DiagnosticWizard.buildDiagnosticData() for the same inputs (plus intake_version). */
const EXPECTED_LEGACY_SHAPE = {
  intake_version: "conversational_v1",
  operatingAndRevenue: "yes",
  businessStage: "Early revenue, 5 people",
  businessStageDropdown: "early_revenue",
  situationDescription:
    "We're growing but cash is tight. Not sure whether to focus on cutting costs or pushing revenue.",
  primaryAreaAffected: "finance",
  situationClarifiers: ["cash flow", "hiring"],
  primaryTheme: "cash_flow",
  mostUrgent: "survive_cash",
  mostUrgentNotes: "Runway under 6 months",
  diagnosticGoal: "improve_cash_flow",
  diagnosticGoalNotes: undefined,
  documentNames: ["pitch.pdf"],
  decisionHorizon: "3 months",
  decisionHorizonDropdown: "3_months",
  clarityLevel: "some_clarity",
  dataAvailable: ["qualitative"],
  riskLevel: "medium",
};

export function runMappingTest(): { ok: boolean; message: string } {
  const out = intakeAnswersToDiagnosticData("startup_founder", UNIFIED);

  for (const key of Object.keys(EXPECTED_LEGACY_SHAPE) as (keyof typeof EXPECTED_LEGACY_SHAPE)[]) {
    const expected = EXPECTED_LEGACY_SHAPE[key];
    const actual = out[key];
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      return {
        ok: false,
        message: `Mismatch at "${key}": expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
      };
    }
  }
  if (Object.keys(out).length !== Object.keys(EXPECTED_LEGACY_SHAPE).length) {
    return {
      ok: false,
      message: `Key count mismatch: expected ${Object.keys(EXPECTED_LEGACY_SHAPE).length}, got ${Object.keys(out).length}`,
    };
  }
  return { ok: true, message: "diagnostic_data matches legacy founder submission shape." };
}

/** MSME: same shape as legacy MSMEDiagnosticWizard.buildDiagnosticData(). */
const LEGACY_MSME_ANSWERS: MSMEAnswers = {
  challenges: ["cash_tight", "ops_messy"],
  challengesNotes: "Need better processes",
  primaryFocus: "cfo",
  primaryFocusNotes: "",
  documentNames: [],
};

const UNIFIED_MSME: UnifiedIntakeAnswers = {
  identity: { organization_name: "SME Co", country: "KE", sector: "retail" },
  role: "msme_owner",
  msme: LEGACY_MSME_ANSWERS,
};

const EXPECTED_MSME_SHAPE = {
  intake_version: "conversational_v1",
  flow: "msme",
  challenges: ["cash_tight", "ops_messy"],
  challengesNotes: "Need better processes",
  primaryFocus: "cfo",
  primaryFocusNotes: undefined,
  documentNames: [],
  operatingAndRevenue: "yes",
  situationDescription: "MSME assessment: cash_tight, ops_messy. Need better processes".trim(),
};

export function runMSMEMappingTest(): { ok: boolean; message: string } {
  const out = intakeAnswersToDiagnosticData("msme_owner", UNIFIED_MSME);

  for (const key of Object.keys(EXPECTED_MSME_SHAPE) as (keyof typeof EXPECTED_MSME_SHAPE)[]) {
    const expected = EXPECTED_MSME_SHAPE[key];
    const actual = out[key];
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      return {
        ok: false,
        message: `MSME mismatch at "${key}": expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
      };
    }
  }
  return { ok: true, message: "diagnostic_data matches legacy MSME submission shape." };
}

/** Social enterprise: founder keys + impact_profile. */
const IMPACT_PROFILE_SEED: ImpactProfileSeed = {
  categories: ["livelihoods_income", "education_skills"],
  metric_focus_areas: ["reach", "jobs_and_income"],
  tracking_existing: true,
  tracking_notes: "Spreadsheets",
  seeking_impact_capital: true,
};

const UNIFIED_SOCIAL: UnifiedIntakeAnswers = {
  identity: { organization_name: "Impact Co", country: "IN", sector: "healthcare" },
  role: "social_enterprise_leader",
  founder: LEGACY_FOUNDER_ANSWERS,
  impact_profile: IMPACT_PROFILE_SEED,
};

export function runSocialEnterpriseMappingTest(): { ok: boolean; message: string } {
  const out = intakeAnswersToDiagnosticData("social_enterprise_leader", UNIFIED_SOCIAL);

  for (const key of Object.keys(EXPECTED_LEGACY_SHAPE) as (keyof typeof EXPECTED_LEGACY_SHAPE)[]) {
    const expected = EXPECTED_LEGACY_SHAPE[key];
    const actual = out[key];
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      return {
        ok: false,
        message: `Social enterprise founder key "${key}": expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
      };
    }
  }

  const impactProfile = out.impact_profile as ImpactProfileSeed | undefined;
  if (!impactProfile || !Array.isArray(impactProfile.categories) || impactProfile.categories.length !== 2) {
    return { ok: false, message: "Social enterprise diagnostic_data.impact_profile missing or invalid." };
  }
  if (
    impactProfile.metric_focus_areas?.length !== 2 ||
    typeof impactProfile.tracking_existing !== "boolean" ||
    typeof impactProfile.seeking_impact_capital !== "boolean"
  ) {
    return { ok: false, message: "Social enterprise impact_profile shape invalid." };
  }
  return { ok: true, message: "diagnostic_data has founder keys + valid impact_profile." };
}

// When run directly
if (typeof process !== "undefined" && process.argv[1]?.endsWith("intake-mapping.test.ts")) {
  const r1 = runMappingTest();
  const r2 = runMSMEMappingTest();
  const r3 = runSocialEnterpriseMappingTest();
  const ok = r1.ok && r2.ok && r3.ok;
  console.log(r1.ok ? "PASS: founder" : "FAIL: " + r1.message);
  console.log(r2.ok ? "PASS: MSME" : "FAIL: " + r2.message);
  console.log(r3.ok ? "PASS: social enterprise" : "FAIL: " + r3.message);
  process.exit(ok ? 0 : 1);
}
