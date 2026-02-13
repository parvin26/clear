"""
Deterministic company profile selection for execution layer (A/B/C).
Used to tailor EMR plan size and language. Do not invent new product steps.
"""
from typing import Any


def get_company_profile(onboarding_context: dict[str, Any] | None) -> str:
    """
    Return "A" | "B" | "C" using only the specified rules.
    - Numeric company_size: <=10 -> A, 11-50 -> B, >50 -> C
    - Band string: "0-10"/"1-10" -> A, "11-50" -> B, "51"/"50+"/"100+" -> C
    - stage: hawker/micro/informal -> A, seed/pre-seed/early -> B, series b/c/growth -> C
    - Else default -> B
    """
    if not onboarding_context:
        return "B"

    company_size = onboarding_context.get("company_size")
    if company_size is not None:
        try:
            n = int(company_size)
            if n <= 10:
                return "A"
            if n <= 50:
                return "B"
            return "C"
        except (TypeError, ValueError):
            pass
        s = str(company_size).strip().lower()
        if "0-10" in s or "1-10" in s:
            return "A"
        if "11-50" in s:
            return "B"
        if "51" in s or "50+" in s or "100+" in s:
            return "C"

    stage = onboarding_context.get("stage")
    if stage:
        s = str(stage).strip().lower()
        if s in ("hawker", "micro", "informal"):
            return "A"
        if s in ("seed", "pre-seed", "early", "pre_seed"):
            return "B"
        if "series b" in s or "series c" in s or "growth" in s or "series b" in s.replace("_", " "):
            return "C"

    return "B"
