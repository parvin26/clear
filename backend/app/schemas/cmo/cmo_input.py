"""
Pydantic schemas for CMO diagnostic input.
"""
from typing import Any, Optional
from pydantic import BaseModel, Field, field_validator


class CMOInputSchema(BaseModel):
    """Schema for CMO diagnostic form input."""
    
    # Primary challenge
    primary_challenge: str = Field(
        ...,
        description="Primary marketing challenge",
        json_schema_extra={
            "enum": ["lead_generation", "brand_awareness", "retention", "digital_eff", "roi"]
        }
    )
    
    # Effective channels (multi-choice)
    effective_channels: list[str] = Field(
        default_factory=list,
        description="Channels that are currently effective"
    )
    
    # Marketing plan status
    marketing_plan_status: str = Field(
        ...,
        description="Current status of marketing plan"
    )
    
    # Metrics review frequency
    metrics_review_frequency: str = Field(
        ...,
        description="How often marketing metrics are reviewed"
    )
    
    # Marketing budget percentage
    marketing_budget_percent: str = Field(
        ...,
        description="Marketing budget as percentage of revenue"
    )
    
    # Customer segmentation
    customer_segmentation: str = Field(
        ...,
        description="Customer segmentation approach"
    )
    
    # Marketing tools
    marketing_tools: list[str] = Field(
        default_factory=list,
        description="Marketing tools currently in use"
    )
    
    # Brand confidence (1-5 scale)
    brand_confidence: int = Field(
        ...,
        ge=1,
        le=5,
        description="Brand confidence level from 1 to 5"
    )
    
    # Strategy alignment
    strategy_alignment: str = Field(
        ...,
        description="Marketing strategy alignment with business goals"
    )
    
    # Optional notes
    notes: Optional[str] = Field(
        None,
        description="Additional notes or context"
    )
    
    enterprise_id: Optional[int] = Field(None, description="Link analysis to enterprise")
    decision_context: Optional[dict[str, Any]] = Field(None, description="Context snapshot at decision initiation")

    @field_validator("primary_challenge")
    @classmethod
    def validate_primary_challenge(cls, v: str) -> str:
        """Validate primary challenge is one of the allowed values."""
        allowed = ["lead_generation", "brand_awareness", "retention", "digital_eff", "roi"]
        if v not in allowed:
            raise ValueError(f"primary_challenge must be one of {allowed}")
        return v

