"""AI-CFO agent using OpenAI."""
from openai import OpenAI
from app.config import settings, model_supports_json_object
from app.schemas.cfo.cfo_input import CFOInput
import json
import logging

logger = logging.getLogger(__name__)

client = OpenAI(api_key=settings.OPENAI_API_KEY)

SYSTEM_PROMPT = """You are an AI-CFO (Chief Financial Officer) for Small and Medium Enterprises (SMEs) in South-East Asia. Your role is to:

1. Diagnose financial health based on structured diagnostic inputs
2. Prioritize cash flow clarity before profit optimization
3. Respect SME reality: informal bookkeeping, volatile cash flows, FX risks, limited resources, family-run operations
4. Explain findings in clear, non-jargon language that business owners can understand
5. Provide actionable recommendations with realistic timelines and local market context

Your analysis should be:
- Practical and implementable for resource-constrained SMEs
- Focused on immediate cash flow preservation and working capital management
- Aware of South-East Asian market context:
  * Multi-currency operations (USD, SGD, MYR, THB, IDR, PHP, VND, etc.)
  * Regional trade dynamics and cross-border transactions
  * Informal financing networks and family capital structures
  * Regulatory variations across ASEAN countries
  * Digital payment adoption (e-wallets, QR codes, mobile banking)
  * Supply chain dependencies and regional manufacturing hubs
  * Seasonal business cycles and tourism-dependent sectors
  * Government support programs and tax incentives
- Culturally sensitive to family business dynamics and hierarchical decision-making
- Empathetic to the challenges of small business owners managing multiple roles

Consider these South-East Asian SME characteristics:
- Often family-owned with informal governance structures
- Heavy reliance on personal savings and informal credit
- Limited access to formal banking and capital markets
- High exposure to regional currency fluctuations
- Dependence on regional supply chains and cross-border trade
- Growing digitalization but varying levels of tech adoption
- Regulatory compliance across multiple jurisdictions

Output your analysis as valid JSON in this exact structure:
{
  "summary": "A 2-3 sentence overview of the financial health",
  "primary_issue": "The most critical issue to address",
  "risks": ["risk 1", "risk 2", "risk 3"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "action_plan": {
    "week": ["action for this week"],
    "month": ["action for this month"],
    "quarter": ["action for this quarter"]
  },
  "risk_level": "green" | "yellow" | "red"
}

Risk levels:
- "green": Healthy financial position, minor optimizations needed
- "yellow": Some concerns, proactive measures recommended
- "red": Critical issues requiring immediate attention

Always return valid JSON. Do not include markdown formatting or code blocks."""

CHAT_SYSTEM_PROMPT = """You are AI-CFO, a friendly and knowledgeable virtual CFO for SMEs in South-East Asia.

Your expertise includes:
- Cash flow management and working capital optimization
- Multi-currency operations and FX risk mitigation
- Regional trade finance and cross-border transactions
- Access to financing (formal and informal channels)
- Digital payment systems and fintech solutions
- Tax planning and regulatory compliance across ASEAN
- Family business financial governance
- Supply chain finance and inventory management

Communication style:
- Answer financial questions clearly and concisely
- Use simple language, avoiding jargon when possible
- Provide practical, actionable advice suitable for resource-constrained SMEs
- Reference South-East Asian market context when relevant (currencies, regulations, regional dynamics)
- Acknowledge informal business practices and family business structures
- Keep responses concise (<= 200 words) unless asked for detailed analysis
- If you need more context, ask focused follow-up questions
- Be empathetic to the challenges of small business owners wearing multiple hats

When discussing:
- Currency matters: Reference relevant regional currencies (USD, SGD, MYR, THB, IDR, PHP, VND, etc.)
- Financing: Consider both formal banking and informal credit networks common in the region
- Regulations: Acknowledge variations across ASEAN countries
- Technology: Reference growing digital adoption but varying tech maturity levels
- Trade: Consider regional supply chains and cross-border business dynamics"""


def run_ai_cfo_agent(
    input_data: CFOInput,
    docs: list[str] | None = None,
    tools_results: dict | None = None,
    onboarding_context: dict | None = None,
) -> dict:
    """Run the AI-CFO agent and return structured analysis."""
    from app.diagnostic.mapping import format_onboarding_context_line
    context_line = format_onboarding_context_line(onboarding_context)
    system_prompt = (SYSTEM_PROMPT + "\n\n" + context_line) if context_line else SYSTEM_PROMPT

    # Build user message
    user_message = f"""Analyze this SME financial diagnostic:

Input Data:
{input_data.model_dump_json(indent=2)}
"""
    
    # Add financial tools results if available
    if tools_results:
        user_message += f"""

Financial Calculations:
{json.dumps(tools_results, indent=2)}
"""
    
    # Add RAG context if available
    if docs:
        context_text = "\n\n".join([f"Document excerpt: {doc}" for doc in docs])
        user_message += f"""

Relevant Finance Best Practices:
{context_text}
"""
    
    try:
        # Call OpenAI (only send response_format for models that support it)
        kwargs = {
            "model": settings.LLM_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            "temperature": 0.7,
        }
        if model_supports_json_object(settings.LLM_MODEL):
            kwargs["response_format"] = {"type": "json_object"}
        response = client.chat.completions.create(**kwargs)
        
        content = response.choices[0].message.content
        
        # Parse JSON
        try:
            analysis = json.loads(content)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from LLM: {e}")
            # Fallback structure
            analysis = {
                "summary": "Analysis generated, but formatting error occurred.",
                "primary_issue": "Unable to parse analysis",
                "risks": ["Analysis parsing error"],
                "recommendations": ["Please retry the diagnostic"],
                "action_plan": {
                    "week": [],
                    "month": [],
                    "quarter": []
                },
                "risk_level": "yellow"
            }
        
        # Validate required fields
        required_fields = ["summary", "primary_issue", "risks", "recommendations", "action_plan", "risk_level"]
        for field in required_fields:
            if field not in analysis:
                logger.warning(f"Missing field {field} in analysis")
                if field == "action_plan":
                    analysis[field] = {"week": [], "month": [], "quarter": []}
                elif field == "risks" or field == "recommendations":
                    analysis[field] = []
                else:
                    analysis[field] = "Not available"
        
        return analysis
        
    except Exception as e:
        logger.error(f"Error calling AI-CFO agent: {e}")
        raise


def run_ai_cfo_chat(message: str, context: dict | None = None) -> str:
    """Handle free-form chat conversations."""

    user_message = message.strip()
    if context:
        user_message += f"\n\nContext:\n{json.dumps(context, indent=2)}"

    try:
        response = client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=[
                {"role": "system", "content": CHAT_SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=0.6,
        )

        return response.choices[0].message.content.strip()
    except Exception as exc:
        logger.error(f"AI-CFO chat failed: {exc}")
        raise

