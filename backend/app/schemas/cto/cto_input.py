"""
Pydantic schemas for CTO diagnostic input.
"""
from typing import Any, Optional, List
from pydantic import BaseModel, Field


class CTOInputSchema(BaseModel):
    """Schema for CTO diagnostic input."""
    
    # Question 1: Biggest challenge
    biggest_challenge: List[str] = Field(
        ...,
        description="Biggest technology or product challenge"
    )
    
    # Question 2: Team composition
    team_composition: str = Field(
        ...,
        description="Composition of technology team"
    )
    
    # Question 3: Stack maturity
    tech_stack_maturity: str = Field(
        ...,
        description="Current technology stack maturity"
    )
    
    # Question 4: Roadmap management
    roadmap_management: str = Field(
        ...,
        description="How product roadmap is managed"
    )
    
    # Question 5: Security policies
    has_security_policies: bool = Field(
        ...,
        description="Has documented IT security and data governance policies"
    )
    
    # Question 6: Operational risks
    operational_risks: str = Field(
        ...,
        description="Critical operational or cybersecurity risks"
    )
    
    # Question 7: DevOps maturity
    devops_maturity: str = Field(
        ...,
        description="Cloud adoption and DevOps capability maturity"
    )
    
    # Question 8: Business alignment
    business_alignment: int = Field(
        ...,
        ge=1,
        le=5,
        description="Alignment between technology initiatives and business goals (1-5)"
    )
    
    # Question 9: Innovation investment
    innovation_investment: str = Field(
        ...,
        description="Investment in innovation, R&D, or emerging technologies"
    )
    
    # Legacy fields (for backward compatibility)
    infra_maturity: Optional[str] = None
    tech_stack: Optional[str] = None
    dev_process: Optional[str] = None
    security_practices: Optional[str] = None
    cloud_usage: Optional[str] = None
    tech_budget_percent: Optional[float] = None
    team_size: Optional[int] = None
    engineering_challenge: Optional[str] = None
    toolset: Optional[str] = None
    automation_level: Optional[str] = None
    notes: Optional[str] = None
    enterprise_id: Optional[int] = Field(None, description="Link analysis to enterprise")
    decision_context: Optional[dict[str, Any]] = Field(None, description="Context snapshot at decision initiation")
    
    class Config:
        json_schema_extra = {
            "example": {
                "biggest_challenge": ["Scaling infrastructure and users"],
                "team_composition": "Fully in-house development team",
                "tech_stack_maturity": "Growing product with some scalable components",
                "roadmap_management": "Agile with defined sprints and backlog",
                "has_security_policies": True,
                "operational_risks": "Manageable risk with monitoring",
                "devops_maturity": "Partial adoption with manual deployments",
                "business_alignment": 4,
                "innovation_investment": "Moderate exploratory budget"
            }
        }

