/**
 * Map general DiagnosticData to valid payloads per agent (schema-aligned).
 * Uses only values allowed by backend Pydantic schemas.
 */

import type { DiagnosticData, PrimaryDomain } from "./diagnostic-types";

function cooPayload(data: DiagnosticData): Record<string, unknown> {
  return {
    biggest_operational_challenge: "process_standardization",
    ops_management_systems: "partial_use",
    kpi_tracking_method: "manual_spreadsheets",
    has_documented_sops: "documented_outdated",
    cost_overruns: ["other"],
    cost_overruns_other: (data.situationDescription || "From capability diagnostic.").slice(0, 500),
    vendor_management_maturity: "partially_managed",
    operational_efficiency_rating: 3,
    workforce_development: ["ad_hoc_training"],
    sustainability_compliance: false,
    notes: data.situationDescription || null,
  };
}

function cfoPayload(data: DiagnosticData): Record<string, unknown> {
  return {
    biggest_challenge: "cash_flow_management",
    monthly_revenue: [0, 0, 0],
    monthly_expenses: [0, 0, 0],
    cash_on_hand: 0,
    debt: 0,
    upcoming_payments: 0,
    funding_structure: "self_funded",
    financial_statements: "no_formal_statements",
    systems_used: ["spreadsheets"],
    unit_economics_visibility: "limited_visibility",
    industry: "services",
    primary_markets: ["domestic"],
    fx_exposure: "single_currency",
    top_revenue_streams: ["General"],
    avg_collection_period_days: 0,
    overdue_invoices_percent: 0,
    inventory_posture: "not_applicable",
    credit_facilities: ["none"],
    risk_appetite: "conservative",
    preferred_output_focus: ["cash_flow"],
    kpi_review_frequency: "quarterly",
    fundraising_plan: "no_plans",
    financial_control_confidence: 2,
    cost_optimization_initiatives: ["none"],
    notes: data.situationDescription || null,
  };
}

function cmoPayload(data: DiagnosticData): Record<string, unknown> {
  return {
    primary_challenge: "lead_generation",
    effective_channels: [],
    marketing_plan_status: "informal",
    metrics_review_frequency: "quarterly",
    marketing_budget_percent: "0-5",
    customer_segmentation: "basic_segments",
    marketing_tools: [],
    brand_confidence: 3,
    strategy_alignment: "partially_aligned",
    notes: data.situationDescription || null,
  };
}

function ctoPayload(data: DiagnosticData): Record<string, unknown> {
  return {
    biggest_challenge: ["Capability and scaling"],
    team_composition: "Mix of in-house and external",
    tech_stack_maturity: "Growing product with some scalable components",
    roadmap_management: "Ad hoc or lightweight",
    has_security_policies: false,
    operational_risks: "Manageable risk with monitoring",
    devops_maturity: "Partial adoption with manual deployments",
    business_alignment: 3,
    innovation_investment: "Minimal or reactive",
    notes: data.situationDescription || null,
  };
}

export function buildAgentPayload(domain: PrimaryDomain, data: DiagnosticData): Record<string, unknown> {
  switch (domain) {
    case "cfo":
      return cfoPayload(data);
    case "cmo":
      return cmoPayload(data);
    case "coo":
      return cooPayload(data);
    case "cto":
      return ctoPayload(data);
    default:
      return cooPayload(data);
  }
}
