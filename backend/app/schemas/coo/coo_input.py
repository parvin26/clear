from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


class COOInput(BaseModel):
    # Question 1: Biggest operational challenge
    biggest_operational_challenge: Literal[
        "scaling_operations",
        "supply_chain_inefficiencies",
        "quality_assurance",
        "workforce_productivity",
        "process_standardization",
        "digital_transformation",
    ]
    # Question 2: Operational management systems
    ops_management_systems: Literal[
        "custom_built",
        "off_the_shelf",
        "partial_use",
        "no_formal_systems",
    ]
    # Question 3: KPI tracking method
    kpi_tracking_method: Literal[
        "realtime_dashboards",
        "manual_spreadsheets",
        "no_formal_tracking",
    ]
    # Question 4: SOP documentation status
    has_documented_sops: Literal["fully_documented", "documented_outdated", "no_sops"]
    # Question 5: Cost overruns (multiple choice)
    cost_overruns: list[Literal[
        "procurement_vendor",
        "labor_workforce",
        "logistics_transportation",
        "equipment_maintenance",
        "other",
    ]]
    cost_overruns_other: str | None = None
    # Question 6: Vendor management maturity
    vendor_management_maturity: Literal[
        "fully_managed",
        "partially_managed",
        "no_formal_management",
    ]
    # Question 7: Operational efficiency rating (1-5)
    operational_efficiency_rating: int = Field(ge=1, le=5)
    # Question 8: Workforce development initiatives
    workforce_development: list[Literal[
        "continuous_training",
        "ad_hoc_training",
        "none",
    ]]
    # Question 9: Sustainability/compliance considerations
    sustainability_compliance: bool
    # Legacy fields (keeping for backward compatibility)
    business_model: Literal["retail", "manufacturing", "services", "agriculture", "mixed"] | None = None
    monthly_output_units: list[int] = Field(default_factory=lambda: [0, 0, 0], min_length=3, max_length=6)
    monthly_ops_costs: list[float] = Field(default_factory=lambda: [0.0, 0.0, 0.0], min_length=3, max_length=6)
    on_time_delivery_rate: float | None = Field(default=None, ge=0, le=100)
    defect_or_return_rate: float | None = Field(default=None, ge=0, le=100)
    avg_lead_time_days: float | None = Field(default=None, ge=0)
    ops_systems_used: list[str] = Field(default_factory=list)
    ops_team_size: int = Field(default=5, ge=0)
    uses_kpi_tracking: Literal["yes_consistently", "sometimes", "not_at_all"] | None = None
    notes: str | None = None
    enterprise_id: Optional[int] = Field(None, description="Link analysis to enterprise")
    decision_context: Optional[dict[str, Any]] = Field(None, description="Context snapshot at decision initiation")

