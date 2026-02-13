"""
Map general diagnostic_data (wizard answers) to agent-specific payloads.
Mirrors frontend buildAgentPayload; produces dicts valid for CFOInput, CMOInputSchema, COOInput, CTOInputSchema.
Optional onboarding_context (size, stage, industry, country) is passed separately into agents for prompt context.
"""
from typing import Any


def format_onboarding_context_line(onboarding_context: dict[str, Any] | None) -> str:
    """
    Build a single line for agent system prompts: company size, stage, industry, country.
    Optional; returns empty string if no onboarding or missing fields.
    """
    if not onboarding_context:
        return ""
    size = onboarding_context.get("company_size") or onboarding_context.get("company_size_band") or ""
    stage = onboarding_context.get("stage") or onboarding_context.get("business_stage") or "operating business"
    industry = onboarding_context.get("industry") or "SME"
    country = onboarding_context.get("country") or ""
    if not size and not stage and not industry and not country:
        return ""
    size_str = f"{size}-person " if size else ""
    stage_str = stage if stage else "organisation"
    country_str = f" in {country}" if country else ""
    return f"You are advising a {size_str}{stage_str} organisation in the {industry} sector{country_str}. Use examples and steps that match this context."


def _situation(data: dict) -> str:
    return (data.get("situationDescription") or "From capability diagnostic.").strip()[:500]


def _onboarding_notes(onboarding_context: dict[str, Any] | None) -> str:
    """Append industry, size, stage to notes for agent context."""
    if not onboarding_context:
        return ""
    industry = onboarding_context.get("industry") or onboarding_context.get("industry_sector") or ""
    size = onboarding_context.get("company_size") or onboarding_context.get("company_size_band") or ""
    stage = onboarding_context.get("stage") or onboarding_context.get("business_stage") or ""
    parts = [p for p in [industry, size, stage] if p]
    if not parts:
        return ""
    return f" Context: {', '.join(parts)}."


def build_cfo_payload(data: dict, onboarding_context: dict[str, Any] | None = None) -> dict[str, Any]:
    """Build payload for CFOInput from diagnostic_data. Injects industry/size/stage from onboarding."""
    industry = "services"
    if onboarding_context:
        industry = (onboarding_context.get("industry") or onboarding_context.get("industry_sector") or "services").lower()
        if industry not in ("manufacturing", "services", "retail", "technology", "agriculture"):
            industry = "services"
    notes = (_situation(data) or "").strip()
    if onboarding_context:
        notes = (notes + _onboarding_notes(onboarding_context)).strip() or None
    return {
        "biggest_challenge": "cash_flow_management",
        "monthly_revenue": [0.0, 0.0, 0.0],
        "monthly_expenses": [0.0, 0.0, 0.0],
        "cash_on_hand": 0.0,
        "debt": 0.0,
        "upcoming_payments": 0.0,
        "funding_structure": "self_funded",
        "financial_statements": "no_formal_statements",
        "systems_used": ["spreadsheets"],
        "unit_economics_visibility": "limited_visibility",
        "industry": industry,
        "primary_markets": ["domestic"],
        "fx_exposure": "single_currency",
        "top_revenue_streams": ["General"],
        "avg_collection_period_days": 0,
        "overdue_invoices_percent": 0.0,
        "inventory_posture": "not_applicable",
        "credit_facilities": ["none"],
        "risk_appetite": "conservative",
        "preferred_output_focus": ["cash_flow"],
        "kpi_review_frequency": "quarterly",
        "fundraising_plan": "no_plans",
        "financial_control_confidence": 2,
        "cost_optimization_initiatives": ["none"],
        "notes": notes,
    }


def build_cmo_payload(data: dict, onboarding_context: dict[str, Any] | None = None) -> dict[str, Any]:
    """Build payload for CMOInputSchema from diagnostic_data. Injects industry/size/stage in notes."""
    notes = (_situation(data) or "").strip()
    if onboarding_context:
        notes = (notes + _onboarding_notes(onboarding_context)).strip() or None
    return {
        "primary_challenge": "lead_generation",
        "effective_channels": [],
        "marketing_plan_status": "informal",
        "metrics_review_frequency": "quarterly",
        "marketing_budget_percent": "0-5",
        "customer_segmentation": "basic_segments",
        "marketing_tools": [],
        "brand_confidence": 3,
        "strategy_alignment": "partially_aligned",
        "notes": notes or None,
    }


def build_coo_payload(data: dict, onboarding_context: dict[str, Any] | None = None) -> dict[str, Any]:
    """Build payload for COOInput from diagnostic_data. Injects industry/size/stage in notes."""
    notes = (_situation(data) or "").strip()
    if onboarding_context:
        notes = (notes + _onboarding_notes(onboarding_context)).strip() or None
    return {
        "biggest_operational_challenge": "process_standardization",
        "ops_management_systems": "partial_use",
        "kpi_tracking_method": "manual_spreadsheets",
        "has_documented_sops": "documented_outdated",
        "cost_overruns": ["other"],
        "cost_overruns_other": notes or None,
        "vendor_management_maturity": "partially_managed",
        "operational_efficiency_rating": 3,
        "workforce_development": ["ad_hoc_training"],
        "sustainability_compliance": False,
        "notes": notes or None,
    }


def build_cto_payload(data: dict, onboarding_context: dict[str, Any] | None = None) -> dict[str, Any]:
    """Build payload for CTOInputSchema from diagnostic_data. Injects industry/size/stage in notes."""
    notes = (_situation(data) or "").strip()
    if onboarding_context:
        notes = (notes + _onboarding_notes(onboarding_context)).strip() or None
    return {
        "biggest_challenge": ["Capability and scaling"],
        "team_composition": "Mix of in-house and external",
        "tech_stack_maturity": "Growing product with some scalable components",
        "roadmap_management": "Ad hoc or lightweight",
        "has_security_policies": False,
        "operational_risks": "Manageable risk with monitoring",
        "devops_maturity": "Partial adoption with manual deployments",
        "business_alignment": 3,
        "innovation_investment": "Minimal or reactive",
        "notes": notes or None,
    }


def build_all_payloads(diagnostic_data: dict, onboarding_context: dict[str, Any] | None = None) -> dict[str, dict[str, Any]]:
    """Return { "cfo": {...}, "cmo": {...}, "coo": {...}, "cto": {...} }. Injects industry, size, stage from onboarding into payloads."""
    return {
        "cfo": build_cfo_payload(diagnostic_data, onboarding_context),
        "cmo": build_cmo_payload(diagnostic_data, onboarding_context),
        "coo": build_coo_payload(diagnostic_data, onboarding_context),
        "cto": build_cto_payload(diagnostic_data, onboarding_context),
    }
