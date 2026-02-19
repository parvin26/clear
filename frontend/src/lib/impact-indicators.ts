/**
 * Universal indicator set (20 core metrics) for impact setup and dashboard.
 * Aligned with DIAGNOSTIC_INTAKE_ARCHITECTURE_AND_TYPES.md.
 */

import type { ImpactCategoryId } from "./intake-types";

export type IndicatorValueType = "count" | "percentage" | "currency" | "score";

export interface IndicatorTemplate {
  id: string;
  name: string;
  category_id: ImpactCategoryId;
  unit: string;
  default_frequency: "monthly" | "quarterly";
  type: IndicatorValueType;
  sdg_tags: string[];
  iris_id?: string;
  notes?: string;
}

export const INDICATOR_TEMPLATES: IndicatorTemplate[] = [
  { id: "total_beneficiaries", name: "Total beneficiaries", category_id: "livelihoods_income", unit: "people", default_frequency: "quarterly", type: "count", sdg_tags: ["SDG 1", "SDG 8"] },
  { id: "active_beneficiaries", name: "Active beneficiaries", category_id: "livelihoods_income", unit: "people", default_frequency: "quarterly", type: "count", sdg_tags: ["SDG 1", "SDG 8"] },
  { id: "geographic_coverage", name: "Geographic coverage", category_id: "community_development", unit: "locations", default_frequency: "quarterly", type: "count", sdg_tags: ["SDG 11"] },
  { id: "jobs_created_fte", name: "Jobs created (FTE)", category_id: "livelihoods_income", unit: "FTE", default_frequency: "quarterly", type: "count", sdg_tags: ["SDG 8"] },
  { id: "people_trained", name: "People trained", category_id: "education_skills", unit: "people", default_frequency: "quarterly", type: "count", sdg_tags: ["SDG 4"] },
  { id: "income_generated_for_beneficiaries", name: "Income generated for beneficiaries", category_id: "livelihoods_income", unit: "currency", default_frequency: "quarterly", type: "currency", sdg_tags: ["SDG 1", "SDG 8"] },
  { id: "students_educated", name: "Students educated", category_id: "education_skills", unit: "people", default_frequency: "quarterly", type: "count", sdg_tags: ["SDG 4"] },
  { id: "learning_hours_delivered", name: "Learning hours delivered", category_id: "education_skills", unit: "hours", default_frequency: "quarterly", type: "count", sdg_tags: ["SDG 4"] },
  { id: "people_with_healthcare_access", name: "People with healthcare access", category_id: "health_wellbeing", unit: "people", default_frequency: "quarterly", type: "count", sdg_tags: ["SDG 3"] },
  { id: "nutrition_support_provided", name: "Nutrition support provided", category_id: "health_wellbeing", unit: "people", default_frequency: "quarterly", type: "count", sdg_tags: ["SDG 2", "SDG 3"] },
  { id: "co2_avoided", name: "CO₂ avoided", category_id: "environment_climate", unit: "tCO2e", default_frequency: "quarterly", type: "count", sdg_tags: ["SDG 13"] },
  { id: "clean_energy_generated_or_access", name: "Clean energy generated or access", category_id: "environment_climate", unit: "MWh or households", default_frequency: "quarterly", type: "count", sdg_tags: ["SDG 7", "SDG 13"] },
  { id: "waste_diverted_from_landfill", name: "Waste diverted from landfill", category_id: "environment_climate", unit: "tonnes", default_frequency: "quarterly", type: "count", sdg_tags: ["SDG 12"] },
  { id: "people_with_financial_services_access", name: "People with financial services access", category_id: "financial_inclusion", unit: "people", default_frequency: "quarterly", type: "count", sdg_tags: ["SDG 1", "SDG 8"] },
  { id: "savings_mobilized", name: "Savings mobilized", category_id: "financial_inclusion", unit: "currency", default_frequency: "quarterly", type: "currency", sdg_tags: ["SDG 1"] },
  { id: "pct_women_beneficiaries", name: "% women beneficiaries", category_id: "gender_inclusion", unit: "%", default_frequency: "quarterly", type: "percentage", sdg_tags: ["SDG 5"] },
  { id: "pct_marginalized_group_beneficiaries", name: "% marginalized group beneficiaries", category_id: "gender_inclusion", unit: "%", default_frequency: "quarterly", type: "percentage", sdg_tags: ["SDG 10"] },
  { id: "beneficiary_satisfaction_score", name: "Beneficiary satisfaction score", category_id: "governance_rights", unit: "score 1-10", default_frequency: "quarterly", type: "score", sdg_tags: ["SDG 16"] },
  { id: "repeat_beneficiaries_pct", name: "Repeat beneficiaries %", category_id: "livelihoods_income", unit: "%", default_frequency: "quarterly", type: "percentage", sdg_tags: ["SDG 8"] },
  { id: "income_change_for_beneficiaries_pct", name: "Income change for beneficiaries %", category_id: "livelihoods_income", unit: "%", default_frequency: "quarterly", type: "percentage", sdg_tags: ["SDG 1", "SDG 8"] },
];

export function getIndicatorsByCategory(categoryIds: ImpactCategoryId[]): IndicatorTemplate[] {
  const set = new Set(categoryIds);
  return INDICATOR_TEMPLATES.filter((t) => set.has(t.category_id));
}

export function getIndicatorById(id: string): IndicatorTemplate | undefined {
  return INDICATOR_TEMPLATES.find((t) => t.id === id);
}
