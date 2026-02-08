"""Canonical decision artifact schema (CLEAR_CONTRACTS A)."""
from typing import Any, Optional
from pydantic import BaseModel, Field


class DecisionContextSchema(BaseModel):
    """Minimal context for the decision."""
    domain: str = Field(..., description="cfo | cmo | coo | cto")
    enterprise_id: Optional[str] = None


class ConstraintSchema(BaseModel):
    """One constraint."""
    id: str
    type: str
    description: str


class OptionConsideredSchema(BaseModel):
    """One option considered."""
    id: str
    title: str
    summary: str


class DecisionArtifactSchema(BaseModel):
    """Canonical decision artifact (required + optional fields for governance)."""
    # Required for finalize
    problem_statement: str = Field(..., min_length=1)
    decision_context: DecisionContextSchema
    constraints: list[ConstraintSchema] = Field(..., min_length=1)
    options_considered: list[OptionConsideredSchema] = Field(..., min_length=1)
    chosen_option_id: str = Field(..., min_length=1)
    rationale: str = Field(..., min_length=1)
    risk_level: str = Field(..., pattern="^(low|medium|high|green|yellow|red)$")
    # Optional
    trade_offs: Optional[list[dict[str, Any]]] = None
    action_plan: Optional[dict[str, list[str]]] = None
    primary_issue: Optional[str] = None
    recommendations: Optional[list[str]] = None
    risks: Optional[list[str]] = None
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None

    def get_option_ids(self) -> set[str]:
        return {o.id for o in self.options_considered}

    def validate_chosen_option(self) -> bool:
        return self.chosen_option_id in self.get_option_ids()
