"""
AI-CMO Agent: Main agent logic for marketing diagnostics.
"""
from typing import Dict, Any, List, Optional
from openai import OpenAI
import json

from app.config import settings, model_supports_json_object
from app.tools.marketing_tools import (
    calculate_CAC,
    LTV_estimate,
    ROI_estimate,
    detect_risk_level,
    basic_marketing_hint
)
from app.rag.vectorstore import search_marketing_docs
from app.db.models import MarketingDocument
from sqlalchemy.orm import Session

# Initialize OpenAI client
client = OpenAI(api_key=settings.OPENAI_API_KEY)

# System prompt for AI-CMO
SYSTEM_PROMPT = """You are "AI-CMO", an expert marketing consultant specializing in helping SMEs (Small and Medium Enterprises) in Southeast Asia improve their marketing strategies.

Your role:
- Diagnose marketing health and identify key issues
- Provide actionable, practical recommendations suitable for SMEs
- Respect budget constraints and resource limitations typical of SMEs
- Focus on measurable improvements and ROI
- Consider Southeast Asian market context and cultural nuances

Output Format:
You MUST respond with valid JSON matching this exact schema:
{
  "summary": "Executive summary (2-3 sentences)",
  "primary_issue": "Main issue identified (1 sentence)",
  "risks": ["risk1", "risk2", "risk3"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "action_plan": {
    "week": ["action1", "action2"],
    "month": ["action1", "action2"],
    "quarter": ["action1", "action2"]
  },
  "risk_level": "green" | "yellow" | "red"
}

Guidelines:
- Be specific and actionable
- Prioritize quick wins for SMEs
- Consider cost-effectiveness
- Focus on digital marketing opportunities
- Address data and measurement gaps
- Provide realistic timelines
"""


def run_ai_cmo_agent(
    input_data: Dict[str, Any],
    db: Session,
    docs: Optional[List[MarketingDocument]] = None,
    onboarding_context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Run the AI-CMO agent to generate marketing analysis.
    
    Args:
        input_data: CMO diagnostic input data
        db: Database session for RAG
        docs: Optional pre-fetched documents
    
    Returns:
        Dictionary containing the analysis
    """
    # Run marketing tools calculations
    # Note: These are estimates since we don't have actual financial data
    tools_results = {
        "hint": basic_marketing_hint(input_data),
        "risk_level": detect_risk_level(input_data)
    }
    
    # Optionally retrieve relevant marketing documents via RAG
    rag_context = ""
    if settings.RAG_ENABLED:
        if docs is None:
            # Build a search query from input data
            search_query = f"""
            Marketing challenge: {input_data.get('primary_challenge', '')}
            Channels: {', '.join(input_data.get('effective_channels', []))}
            Strategy: {input_data.get('strategy_alignment', '')}
            """
            docs = search_marketing_docs(db, search_query, top_k=settings.RAG_TOP_K)
        
        if docs:
            rag_context = "\n\nRelevant Marketing Knowledge:\n"
            for doc in docs:
                rag_context += f"- {doc.title}: {doc.content[:500]}...\n"
    
    # Build the user prompt
    user_prompt = f"""Analyze this SME marketing diagnostic:

Primary Challenge: {input_data.get('primary_challenge', 'N/A')}
Effective Channels: {', '.join(input_data.get('effective_channels', []))}
Marketing Plan Status: {input_data.get('marketing_plan_status', 'N/A')}
Metrics Review Frequency: {input_data.get('metrics_review_frequency', 'N/A')}
Marketing Budget: {input_data.get('marketing_budget_percent', 'N/A')}% of revenue
Customer Segmentation: {input_data.get('customer_segmentation', 'N/A')}
Marketing Tools: {', '.join(input_data.get('marketing_tools', []))}
Brand Confidence: {input_data.get('brand_confidence', 'N/A')}/5
Strategy Alignment: {input_data.get('strategy_alignment', 'N/A')}
Notes: {input_data.get('notes', 'None')}

{tools_results.get('hint', '')}

{rag_context}

Provide a comprehensive analysis in the required JSON format."""

    from app.diagnostic.mapping import format_onboarding_context_line
    context_line = format_onboarding_context_line(onboarding_context or {})
    system_prompt = (SYSTEM_PROMPT + "\n\n" + context_line) if context_line else SYSTEM_PROMPT

    try:
        # Call OpenAI API (only send response_format for models that support it)
        kwargs = {
            "model": settings.LLM_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.7,
        }
        if model_supports_json_object(settings.LLM_MODEL):
            kwargs["response_format"] = {"type": "json_object"}
        response = client.chat.completions.create(**kwargs)
        
        # Parse the response
        content = response.choices[0].message.content
        analysis = json.loads(content)
        
        # Ensure risk_level is set (use tool result if not in AI response)
        if "risk_level" not in analysis:
            analysis["risk_level"] = tools_results["risk_level"]
        
        return analysis
        
    except json.JSONDecodeError as e:
        # Fallback if JSON parsing fails
        return {
            "summary": "Analysis completed, but response format was invalid.",
            "primary_issue": "Unable to parse AI response",
            "risks": ["Technical error in analysis generation"],
            "recommendations": ["Please try again or contact support"],
            "action_plan": {
                "week": [],
                "month": [],
                "quarter": []
            },
            "risk_level": tools_results["risk_level"]
        }
    except Exception as e:
        # Fallback for any other errors
        return {
            "summary": f"Error generating analysis: {str(e)}",
            "primary_issue": "Technical error occurred",
            "risks": ["Unable to complete analysis"],
            "recommendations": ["Please try again later"],
            "action_plan": {
                "week": [],
                "month": [],
                "quarter": []
            },
            "risk_level": "yellow"
        }

