/**
 * Mapping tests: intakeAnswersToDiagnosticData must produce the same diagnostic_data
 * shape as legacy wizards for founder and MSME; social enterprise must include impact_profile.
 */

import { intakeAnswersToDiagnosticData } from "./intake-mapping";
import { sdgThemesToImpactCategories } from "./intake-constants";
import type {
  FounderAnswers,
  MSMEAnswers,
  ImpactProfileSeed,
  UnifiedIntakeAnswers,
  InvestorThemeId,
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
  situationDescription: "MSME assessment: cash_tight, ops_messy. Need better processes",
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

/** MSME with new optional fields: richer situationDescription and optional decisionHorizon. */
const RICH_MSME_ANSWERS: MSMEAnswers = {
  challenges: ["cash_tight"],
  challengesNotes: "Need better processes",
  years_operating: "3-5",
  primary_constraint: "cash",
  demand_sentiment: "growing",
  decision_horizon: "6_months",
  priority_sentence: "Get a clear cash forecast.",
  primaryFocus: "cfo",
  primaryFocusNotes: "",
  documentNames: [],
};

const UNIFIED_RICH_MSME: UnifiedIntakeAnswers = {
  identity: { organization_name: "SME Co", country: "KE", sector: "retail" },
  role: "msme_owner",
  msme: RICH_MSME_ANSWERS,
};

export function runRichMSMEMappingTest(): { ok: boolean; message: string } {
  const out = intakeAnswersToDiagnosticData("msme_owner", UNIFIED_RICH_MSME);

  if (out.flow !== "msme" || !Array.isArray(out.challenges) || out.challenges.length !== 1) {
    return { ok: false, message: "Rich MSME: flow or challenges missing." };
  }
  if (!out.situationDescription || out.situationDescription.length < 20) {
    return { ok: false, message: "Rich MSME: situationDescription missing or too short." };
  }
  const s = out.situationDescription;
  if (!s.includes("MSME assessment") || !s.includes("cash_tight")) {
    return { ok: false, message: "Rich MSME: situationDescription should include challenges." };
  }
  if (!s.includes("Operating: 3-5") || !s.includes("Constraint: cash") || !s.includes("Demand: growing")) {
    return { ok: false, message: "Rich MSME: situationDescription should include years_operating, primary_constraint, demand_sentiment." };
  }
  if (!s.includes("Get a clear cash forecast")) {
    return { ok: false, message: "Rich MSME: situationDescription should include priority_sentence." };
  }
  if ((out as Record<string, unknown>).decisionHorizon !== "6_months") {
    return { ok: false, message: "Rich MSME: decisionHorizon should be set." };
  }
  return { ok: true, message: "diagnostic_data has richer MSME situationDescription and decisionHorizon." };
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

/** Investor: sdg_themes → themes derivation; payload includes both. */
export function runInvestorSdgThemesTest(): { ok: boolean; message: string } {
  const themes = sdgThemesToImpactCategories(["sdg_1", "sdg_4", "sdg_16"] as InvestorThemeId[]);
  if (!Array.isArray(themes) || themes.length === 0) {
    return { ok: false, message: "sdgThemesToImpactCategories should return non-empty array." };
  }
  const set = new Set(themes);
  if (!set.has("livelihoods_income") || !set.has("financial_inclusion")) {
    return { ok: false, message: "sdg_1 should map to livelihoods_income and financial_inclusion." };
  }
  if (!set.has("education_skills")) {
    return { ok: false, message: "sdg_4 should map to education_skills." };
  }
  if (!set.has("governance_rights")) {
    return { ok: false, message: "sdg_16 should map to governance_rights." };
  }
  return { ok: true, message: "sdg_themes → themes derivation works." };
}

// When run directly
if (typeof process !== "undefined" && process.argv[1]?.endsWith("intake-mapping.test.ts")) {
  const r1 = runMappingTest();
  const r2 = runMSMEMappingTest();
  const r3 = runRichMSMEMappingTest();
  const r4 = runSocialEnterpriseMappingTest();
  const r5 = runInvestorSdgThemesTest();
  const ok = r1.ok && r2.ok && r3.ok && r4.ok && r5.ok;
  console.log(r1.ok ? "PASS: founder" : "FAIL: " + r1.message);
  console.log(r2.ok ? "PASS: MSME" : "FAIL: " + r2.message);
  console.log(r3.ok ? "PASS: rich MSME" : "FAIL: " + r3.message);
  console.log(r4.ok ? "PASS: social enterprise" : "FAIL: " + r4.message);
  console.log(r5.ok ? "PASS: investor sdg_themes" : "FAIL: " + r5.message);
  process.exit(ok ? 0 : 1);
}
