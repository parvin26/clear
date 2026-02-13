"""Pydantic schemas for CFO diagnostic input."""
from pydantic import BaseModel, Field
from typing import Any, Optional


class CFOInput(BaseModel):
    """Input schema for CFO diagnostic."""
    
    biggest_challenge: str = Field(
        ...,
        description="Primary financial challenge",
        examples=[
            "cash_flow_management",
            "profitability_optimization",
            "forecasting_budgeting",
            "fundraising_access",
            "cost_control",
            "financial_risk_management",
        ],
    )
    monthly_revenue: list[float] = Field(
        ...,
        min_length=3,
        max_length=6,
        description="Last 3-6 months of revenue"
    )
    monthly_expenses: list[float] = Field(
        ...,
        min_length=3,
        max_length=6,
        description="Last 3-6 months of expenses"
    )
    cash_on_hand: float = Field(..., ge=0, description="Current cash on hand")
    debt: float = Field(..., ge=0, description="Total debt")
    upcoming_payments: Optional[float] = Field(None, ge=0, description="Upcoming payments due")
    funding_structure: str = Field(
        ...,
        description="Funding structure",
        examples=[
            "self_funded",
            "bank_loans",
            "venture_investment",
            "grants_support",
            "other",
        ],
    )
    funding_structure_other: Optional[str] = Field(
        None,
        description="Optional detail when funding structure is other",
    )
    financial_statements: str = Field(
        ...,
        description="Financial statement preparation status",
        examples=[
            "monthly_internal_team",
            "monthly_external_accountant",
            "no_formal_statements",
        ],
    )
    systems_used: list[str] = Field(
        ...,
        description="Financial systems in use",
        examples=[
            ["erp", "accounting_software", "spreadsheets", "none"],
        ],
    )
    unit_economics_visibility: str = Field(
        ...,
        description="Unit economics visibility level",
        examples=[
            "detailed_visible",
            "limited_visibility",
            "no_visibility",
        ],
    )
    industry: str = Field(
        ...,
        description="Primary industry classification",
        examples=[
            "manufacturing",
            "services",
            "retail",
            "technology",
            "agriculture",
        ],
    )
    primary_markets: list[str] = Field(
        ...,
        description="Primary markets or regions served",
        examples=[["domestic", "singapore", "malaysia", "thailand", "indonesia", "philippines", "vietnam", "myanmar", "cambodia", "laos", "brunei", "asean", "asia_pacific", "global"]],
    )
    fx_exposure: str = Field(
        ...,
        description="Foreign currency exposure level",
        examples=["low", "moderate", "high", "single_currency"],
    )
    top_revenue_streams: list[str] = Field(
        ...,
        min_length=1,
        max_length=5,
        description="Key revenue streams or products",
    )
    avg_collection_period_days: int = Field(
        ...,
        ge=0,
        le=365,
        description="Average collection period (DSO)",
    )
    overdue_invoices_percent: float = Field(
        ...,
        ge=0,
        le=100,
        description="Percent of invoices overdue",
    )
    inventory_posture: str = Field(
        ...,
        description="Inventory position assessment",
        examples=["lean", "balanced", "overstocked", "not_applicable"],
    )
    credit_facilities: list[str] = Field(
        ...,
        description="Access to credit facilities",
        examples=[["overdraft", "working_capital_line", "factoring", "none"]],
    )
    risk_appetite: str = Field(
        ...,
        description="Organization's risk appetite",
        examples=["conservative", "balanced", "growth", "aggressive"],
    )
    preferred_output_focus: list[str] = Field(
        ...,
        description="Preferred focus areas for AI-CFO recommendations",
        examples=[["cash_flow", "board_summary", "deep_finance_dive"]],
    )
    kpi_review_frequency: str = Field(
        ...,
        description="Review cadence for financial KPIs",
        examples=["weekly", "monthly", "quarterly", "ad_hoc"],
    )
    fundraising_plan: str = Field(
        ...,
        description="Fundraising plans within the next 12 months",
        examples=["active", "considering", "no_plans"],
    )
    financial_control_confidence: int = Field(
        ...,
        ge=1,
        le=5,
        description="Confidence in financial controls (1-5)",
    )
    cost_optimization_initiatives: list[str] = Field(
        ...,
        description="Current cost optimization or automation initiatives",
        examples=[
            [
                "tech_automation",
                "outsourcing_finance",
                "process_optimization",
                "none",
                "other",
            ]
        ],
    )
    cost_optimization_other: Optional[str] = Field(
        None,
        description="Additional context for other initiatives",
    )
    notes: Optional[str] = Field(None, description="Additional notes")
    # Phase 2: optional enterprise + decision context
    enterprise_id: Optional[int] = Field(None, description="Link analysis to enterprise")
    decision_context: Optional[dict[str, Any]] = Field(None, description="Context snapshot at decision initiation")

