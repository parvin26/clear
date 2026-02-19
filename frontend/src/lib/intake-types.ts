/**
 * Types for the conversational diagnostic intake (Phase 1: identity, role, founder, MSME).
 * Extended in Phase 2 for impact profile and investor profile.
 */

export type Role =
  | "msme_owner"
  | "startup_founder"
  | "social_enterprise_leader"
  | "aspiring_entrepreneur"
  | "impact_investor";

export type OrgSizeBand = "solo" | "2-10" | "11-50" | "51-200" | "200+";

export interface IntakeIdentity {
  organization_name: string;
  country: string;
  sector: string;
  org_size_band?: OrgSizeBand;
  contact_email?: string;
  allow_sign_in_later?: boolean;
}

/** Founder path answers (maps to existing diagnostic_data keys). */
export interface FounderAnswers {
  operatingAndRevenue: "yes" | "no";
  businessStage: string;
  businessStageDropdown?: string;
  situationDescription: string;
  primaryAreaAffected?: string;
  situationClarifiers: string[];
  primaryTheme?: string;
  mostUrgent: string;
  mostUrgentNotes?: string;
  diagnosticGoal: string;
  diagnosticGoalNotes?: string;
  documentNames: string[];
  decisionHorizon: string;
  decisionHorizonDropdown?: string;
}

/** MSME path answers. */
export interface MSMEAnswers {
  challenges: string[];
  challengesNotes?: string;
  primaryFocus?: string;
  primaryFocusNotes?: string;
  documentNames: string[];
}

/** 8 Universal Impact Categories (for social enterprise add-on). */
export type ImpactCategoryId =
  | "livelihoods_income"
  | "education_skills"
  | "health_wellbeing"
  | "environment_climate"
  | "financial_inclusion"
  | "gender_inclusion"
  | "community_development"
  | "governance_rights";

/** Metric focus areas for impact profile. */
export type MetricFocusArea =
  | "reach"
  | "jobs_and_income"
  | "education"
  | "health"
  | "environment"
  | "financial_inclusion"
  | "gender_inclusion";

/** Social enterprise impact add-on (seed for ImpactProfile). */
export interface ImpactProfileSeed {
  categories: ImpactCategoryId[];
  metric_focus_areas: MetricFocusArea[];
  tracking_existing: boolean;
  tracking_notes?: string;
  seeking_impact_capital: boolean;
}

/** Impact investor profile (no diagnostic run). */
export type PortfolioStage =
  | "evaluating_opportunities"
  | "active_portfolio"
  | "reporting_phase"
  | "mixed";

export type InvestorNeed =
  | "due_diligence_support"
  | "portfolio_monitoring"
  | "impact_measurement_and_reporting"
  | "exit_and_realization_planning";

export interface InvestorProfile {
  sectors: string[];
  geographies: string[];
  themes: ImpactCategoryId[];
  portfolio_stage: PortfolioStage;
  primary_needs: InvestorNeed[];
}

/** Unified intake state. */
export interface UnifiedIntakeAnswers {
  identity: IntakeIdentity;
  role: Role;
  founder?: FounderAnswers;
  msme?: MSMEAnswers;
  impact_profile?: ImpactProfileSeed;
  investor_profile?: InvestorProfile;
}

/**
 * Output shape for POST /api/clear/diagnostic/run diagnostic_data.
 * Must match backend expectations (situationDescription, flow, challenges, etc.).
 */
export interface DiagnosticDataOut {
  intake_version?: string;
  operatingAndRevenue?: "yes" | "no";
  businessStage?: string;
  businessStageDropdown?: string;
  situationDescription: string;
  primaryAreaAffected?: string;
  situationClarifiers?: string[];
  primaryTheme?: string;
  mostUrgent?: string;
  mostUrgentNotes?: string;
  diagnosticGoal?: string;
  diagnosticGoalNotes?: string;
  documentNames?: string[];
  decisionHorizon?: string;
  decisionHorizonDropdown?: string;
  clarityLevel?: string;
  dataAvailable?: string[];
  riskLevel?: string;
  flow?: "msme";
  challenges?: string[];
  challengesNotes?: string;
  primaryFocus?: string;
  primaryFocusNotes?: string;
  impact_profile?: ImpactProfileSeed;
  [key: string]: unknown;
}

/** Step identifier for sequencing. */
export type StepId =
  | "identity"
  | "role"
  | "founder_operating"
  | "founder_stage"
  | "founder_situation"
  | "founder_themes"
  | "founder_urgency"
  | "founder_goal"
  | "founder_docs"
  | "founder_horizon"
  | "impact_categories"
  | "impact_metric_focus"
  | "impact_tracking"
  | "impact_capital"
  | "investor_thesis"
  | "investor_stage"
  | "investor_needs"
  | "msme_challenges"
  | "msme_focus"
  | "msme_docs"
  | "submit";

/** Roles that call runDiagnosticRun and get a decision. */
export const ROLES_WITH_DIAGNOSTIC_RUN: Role[] = ["msme_owner", "startup_founder", "social_enterprise_leader"];
export const ROLE_MSME: Role = "msme_owner";
export const ROLE_FOUNDER: Role = "startup_founder";

export const FOUNDER_STEP_IDS: StepId[] = [
  "founder_operating",
  "founder_stage",
  "founder_situation",
  "founder_themes",
  "founder_urgency",
  "founder_goal",
  "founder_docs",
  "founder_horizon",
  "submit",
];

export const IMPACT_ADDON_STEP_IDS: StepId[] = [
  "impact_categories",
  "impact_metric_focus",
  "impact_tracking",
  "impact_capital",
  "submit",
];

export const SOCIAL_ENTERPRISE_STEP_IDS: StepId[] = [
  ...FOUNDER_STEP_IDS.slice(0, -1),
  ...IMPACT_ADDON_STEP_IDS,
];

export const INVESTOR_STEP_IDS: StepId[] = [
  "investor_thesis",
  "investor_stage",
  "investor_needs",
  "submit",
];

export const MSME_STEP_IDS: StepId[] = ["msme_challenges", "msme_focus", "msme_docs", "submit"];

export function getStepSequence(role: Role | null): StepId[] {
  if (!role) return [];
  if (role === "msme_owner") return MSME_STEP_IDS;
  if (role === "startup_founder") return FOUNDER_STEP_IDS;
  if (role === "social_enterprise_leader") return SOCIAL_ENTERPRISE_STEP_IDS;
  if (role === "impact_investor") return INVESTOR_STEP_IDS;
  return [];
}
