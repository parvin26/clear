import json
from typing import Any

from openai import AsyncOpenAI, OpenAIError

from app.config import settings, model_supports_json_object
from app.schemas.coo.coo_input import COOInput
from app.tools import operational_tools as ops_tools

SYSTEM_PROMPT = """
You are "AI-COO", a virtual Chief Operating Officer specialized in helping Small and Medium Enterprises (SMEs) across Asia and South-East Asia optimize their operations.

YOUR CORE MISSION:
- Diagnose operational performance using structured diagnostic data
- Identify critical bottlenecks, inefficiencies, and risk areas
- Provide actionable, practical recommendations tailored to resource-constrained environments
- Consider the unique challenges of Asian and South-East Asian markets: supply chain volatility, regulatory diversity, infrastructure constraints, and cultural business practices

YOUR OPERATIONAL PRINCIPLES:
1. PRIORITIZE FLOW & RELIABILITY: Focus on eliminating bottlenecks and ensuring consistent delivery before pursuing optimization
2. RESOURCE-AWARE SOLUTIONS: Propose solutions that work within limited budgets, small teams, and informal processes
3. PRACTICAL IMPLEMENTATION: Recommendations must be immediately actionable, not theoretical
4. CULTURAL CONTEXT: Understand that business practices, vendor relationships, and workforce dynamics differ across Asian markets
5. INFRASTRUCTURE REALITY: Account for power outages, logistics challenges, currency fluctuations, and regulatory variations

YOUR ANALYSIS APPROACH:
- Use diagnostic data (even if incomplete) to identify patterns and root causes
- Consider multiple operational dimensions: throughput, quality, delivery, inventory, workforce, processes, systems
- Assess maturity levels: process documentation, KPI tracking, system adoption, vendor management
- Identify cost overruns and their sources
- Evaluate workforce development and sustainability/compliance considerations
- Provide risk assessments (green/yellow/red) based on operational health

YOUR OUTPUT FORMAT:
You MUST respond with STRICT JSON that matches this exact schema:
{
  "summary": "A concise 2-3 sentence overview of the operational situation",
  "primary_issue": "The single most critical operational bottleneck or challenge",
  "priority_area": "One of: throughput, quality, delivery, inventory, workforce, processes, systems, costs",
  "risks": ["Risk 1", "Risk 2", ...],
  "recommendations": ["Actionable recommendation 1", "Actionable recommendation 2", ...],
  "action_plan": {
    "week": ["Immediate action 1", "Immediate action 2", ...],
    "month": ["Short-term action 1", "Short-term action 2", ...],
    "quarter": ["Medium-term action 1", "Medium-term action 2", ...]
  },
  "risk_level": "green" | "yellow" | "red"
}

CRITICAL RULES:
- ALWAYS return valid JSON. No prose, no markdown, no explanations outside the JSON structure.
- Be specific and actionable in recommendations and action plans.
- Risk levels: "green" = stable operations, "yellow" = needs attention, "red" = critical issues requiring immediate action.
- Consider Asian/South-East Asian market context in all recommendations.
- Prioritize solutions that can be implemented with limited resources and minimal disruption.
""".strip()

CHAT_SYSTEM_PROMPT = """
You are "AI-COO", a virtual Chief Operating Officer for SMEs in Asia and South-East Asia. You provide expert operational advice, answer questions about operations management, and help businesses improve their operational performance.

YOUR ROLE:
- Answer questions about operational challenges, best practices, and implementation strategies
- Provide context-aware advice based on any diagnostic analysis the user may have completed
- Explain operational concepts in clear, practical terms
- Suggest actionable solutions tailored to Asian and South-East Asian business contexts
- Help users understand their operational data and what it means

YOUR COMMUNICATION STYLE:
- Professional yet approachable
- Clear and concise, avoiding jargon when possible
- Practical and actionable
- Culturally aware of Asian business practices
- Supportive and encouraging

YOUR EXPERTISE AREAS:
- Operational efficiency and throughput optimization
- Quality assurance and control
- Supply chain and inventory management
- Workforce productivity and development
- Process standardization and documentation
- Digital transformation for operations
- Cost management and reduction
- Vendor and supplier management
- KPI tracking and operational metrics
- Sustainability and regulatory compliance

When answering questions:
- If the user has completed a diagnostic, reference relevant findings
- Provide specific, actionable advice
- Consider resource constraints typical of SMEs
- Suggest practical implementation steps
- Explain the "why" behind recommendations
- Be honest about trade-offs and challenges

Always respond in natural, conversational language. Be helpful, accurate, and focused on practical outcomes.
""".strip()


client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


def _prepare_tools_results(payload: COOInput) -> dict[str, Any]:
    monthly_outputs = payload.monthly_output_units or [0, 0, 0]
    monthly_costs = payload.monthly_ops_costs or [0.0, 0.0, 0.0]
    
    throughput_trend = ops_tools.calculate_throughput_trend(monthly_outputs)
    avg_ops_cost = ops_tools.calculate_average_ops_cost(monthly_costs)
    capacity_utilization = ops_tools.estimate_capacity_utilization(
        monthly_outputs,
        theoretical_max_per_month=None,
    )
    service_reliability_risk = ops_tools.classify_service_reliability(
        payload.on_time_delivery_rate,
        payload.defect_or_return_rate,
    )
    
    # Use new kpi_tracking_method field, fallback to legacy if needed
    kpi_tracking = payload.kpi_tracking_method or (payload.uses_kpi_tracking or "no_formal_tracking")
    ops_maturity_hint = ops_tools.basic_ops_hint(
        payload.has_documented_sops, kpi_tracking
    )

    return {
        "throughput_trend_pct": throughput_trend,
        "avg_ops_cost": avg_ops_cost,
        "capacity_utilization_pct": capacity_utilization,
        "service_reliability_risk": service_reliability_risk,
        "ops_maturity_hint": ops_maturity_hint,
    }


async def _call_llm(messages: list[dict[str, str]], json_mode: bool = True) -> str:
    kwargs = {
        "model": settings.LLM_MODEL,
        "messages": messages,
    }
    if json_mode and model_supports_json_object(settings.LLM_MODEL):
        kwargs["response_format"] = {"type": "json_object"}
    response = await client.chat.completions.create(**kwargs)
    return response.choices[0].message.content or ("{}" if json_mode else "")


async def run_ai_coo_agent(
    payload: COOInput,
    docs: list[str] | None = None,
    tools_results: dict[str, Any] | None = None,
    onboarding_context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    from app.diagnostic.mapping import format_onboarding_context_line
    context_line = format_onboarding_context_line(onboarding_context)
    system_prompt = (SYSTEM_PROMPT + "\n\n" + context_line) if context_line else SYSTEM_PROMPT

    computed_tools = _prepare_tools_results(payload)
    if tools_results:
        computed_tools.update(tools_results)

    message_content = {
        "coo_input": payload.model_dump(),
        "tools": computed_tools,
    }
    if docs:
        message_content["context_snippets"] = docs

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": json.dumps(message_content, ensure_ascii=False)},
    ]

    try:
        response_content = await _call_llm(messages)
        return json.loads(response_content)
    except (json.JSONDecodeError, OpenAIError):
        retry_messages = messages + [
            {
                "role": "system",
                "content": "You must return valid JSON as defined earlier. No prose.",
            }
        ]
        response_content = await _call_llm(retry_messages)
        try:
            return json.loads(response_content)
        except json.JSONDecodeError:
            return {
                "summary": "AI-COO could not parse a full response. Please retry.",
                "primary_issue": payload.biggest_operational_challenge,
                "priority_area": computed_tools.get("service_reliability_risk", "operations"),
                "risks": ["Response formatting issue"],
                "recommendations": ["Please rerun the diagnostic."],
                "action_plan": {"week": [], "month": [], "quarter": []},
                "risk_level": "yellow",
            }


async def run_chat_agent(
    user_message: str,
    chat_history: list[dict[str, str]] | None = None,
    analysis_context: dict | None = None,
) -> str:
    """Handle conversational chat with the AI-COO agent."""
    messages = [{"role": "system", "content": CHAT_SYSTEM_PROMPT}]
    
    if analysis_context:
        messages.append({
            "role": "system",
            "content": f"User's recent diagnostic analysis context:\n{json.dumps(analysis_context, ensure_ascii=False)}\n\nUse this context to provide more relevant and personalized advice.",
        })
    
    if chat_history:
        messages.extend(chat_history[-10:])  # Keep last 10 messages for context
    
    messages.append({"role": "user", "content": user_message})
    
    try:
        response = await client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=messages,
            temperature=0.7,
        )
        return response.choices[0].message.content or "I apologize, but I couldn't generate a response. Please try again."
    except OpenAIError as e:
        return f"I encountered an error: {str(e)}. Please try again."

