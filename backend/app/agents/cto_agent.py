"""
AI-CTO Agent powered by OpenAI.
"""
import json
from typing import Dict, Any, List, Optional
from openai import OpenAI
import httpx
from app.config import settings, model_supports_json_object
from app.schemas.cto.cto_analysis import CTOAnalysisSchema, Risk, Recommendation, ActionPlan, ActionPlanItem


SYSTEM_PROMPT = """You are an AI-CTO (Chief Technology Officer) for SMEs in Southeast Asia. Your expertise includes:

1. Technology infrastructure maturity assessment
2. Engineering health and development process evaluation
3. Cloud efficiency and DevOps capability analysis
4. Security posture and compliance readiness
5. Team structure and technology stack optimization
6. Strategic technology roadmap planning

Your role is to:
- Diagnose technology maturity, engineering health, cloud efficiency, security posture, and team readiness
- Provide actionable, structured recommendations
- Identify risks and create prioritized action plans
- Align technology initiatives with business goals

Always respond with structured JSON following the exact schema provided. Be specific, actionable, and consider the Southeast Asian SME context (budget constraints, scalability needs, regulatory requirements).

Output format must be valid JSON matching the CTOAnalysisSchema structure."""


def run_ai_cto_agent(
    input_data: Dict[str, Any],
    tools_results: Dict[str, Any],
    rag_context: Optional[List[Dict[str, Any]]] = None,
    onboarding_context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Run the AI-CTO agent with input data, tools results, and optional RAG context.
    
    Returns:
        Dict containing the structured analysis matching CTOAnalysisSchema
    """
    if not settings.OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY is not configured")
    
    try:
        # Create custom httpx client to avoid proxies compatibility issue
        http_client = httpx.Client(
            timeout=httpx.Timeout(60.0),
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
        )
        client = OpenAI(
            api_key=settings.OPENAI_API_KEY,
            http_client=http_client
        )
    except Exception as e:
        raise ValueError(f"Error initializing OpenAI client: {str(e)}")
    
    # Build context from tools results
    tools_summary = f"""
Technology Metrics:
- Infrastructure Score: {tools_results.get('infra_score', 0):.1f}/100
- DevOps Maturity Score: {tools_results.get('devops_maturity_score', 0):.1f}/100
- Risk Level: {tools_results.get('risk_level', 'unknown')}
- Cloud Efficiency: {tools_results.get('cloud_efficiency', {}).get('efficiency_level', 'unknown')}
- Quick Hints: {', '.join(tools_results.get('hints', []))}
"""
    
    # Build RAG context if available
    rag_summary = ""
    if rag_context and len(rag_context) > 0:
        rag_summary = "\n\nRelevant Technical Guidance:\n"
        for i, doc in enumerate(rag_context[:3], 1):
            rag_summary += f"{i}. {doc.get('title', '')}: {doc.get('content', '')[:200]}...\n"
    
    # Build user prompt
    user_prompt = f"""Analyze the following technology diagnostic input and provide a comprehensive CTO analysis.

INPUT DATA:
{json.dumps(input_data, indent=2)}

{tools_summary}
{rag_summary}

Provide a structured analysis with:
1. Executive summary (2-3 sentences)
2. Primary issue identification
3. List of risks (title, description, severity: high/medium/low, impact)
4. List of recommendations (title, description, category, priority: high/medium/low, estimated_impact)
5. Action plan organized by timeframe:
   - week: Immediate actions (next 1-2 weeks)
   - month: Short-term actions (next month)
   - quarter: Medium-term actions (next quarter)
6. Overall risk level (low/medium/high)

Respond ONLY with valid JSON matching this structure:
{{
  "summary": "Executive summary...",
  "primary_issue": "Main challenge...",
  "risks": [
    {{"title": "...", "description": "...", "severity": "high|medium|low", "impact": "..."}}
  ],
  "recommendations": [
    {{"title": "...", "description": "...", "category": "...", "priority": "high|medium|low", "estimated_impact": "..."}}
  ],
  "action_plan": {{
    "week": [{{"title": "...", "description": "...", "priority": "high|medium|low"}}],
    "month": [{{"title": "...", "description": "...", "priority": "high|medium|low"}}],
    "quarter": [{{"title": "...", "description": "...", "priority": "high|medium|low"}}]
  }},
  "risk_level": "low|medium|high"
}}

Ensure all JSON is valid and properly formatted."""

    from app.diagnostic.mapping import format_onboarding_context_line
    context_line = format_onboarding_context_line(onboarding_context or {})
    system_prompt = (SYSTEM_PROMPT + "\n\n" + context_line) if context_line else SYSTEM_PROMPT

    try:
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
        
        content = response.choices[0].message.content
        
        # Parse JSON response
        try:
            analysis_data = json.loads(content)
        except json.JSONDecodeError as e:
            # Try to extract JSON if wrapped in markdown
            if "```json" in content:
                json_start = content.find("```json") + 7
                json_end = content.find("```", json_start)
                content = content[json_start:json_end].strip()
                analysis_data = json.loads(content)
            elif "```" in content:
                json_start = content.find("```") + 3
                json_end = content.find("```", json_start)
                content = content[json_start:json_end].strip()
                analysis_data = json.loads(content)
            else:
                raise e
        
        # Validate and ensure required fields
        if "risk_level" not in analysis_data:
            analysis_data["risk_level"] = tools_results.get("risk_level", "medium")
        
        # Ensure lists exist
        if "risks" not in analysis_data:
            analysis_data["risks"] = []
        if "recommendations" not in analysis_data:
            analysis_data["recommendations"] = []
        if "action_plan" not in analysis_data:
            analysis_data["action_plan"] = {"week": [], "month": [], "quarter": []}
        
        return analysis_data
        
    except Exception as e:
        raise Exception(f"Error running AI-CTO agent: {str(e)}")

