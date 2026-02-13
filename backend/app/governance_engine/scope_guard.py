"""
Decision-scoped chat guard (Phase 1B).
When a chat request is scoped to a decision (decision_id present), ensure the session
is linked via decision_chat_sessions and optionally detect "new problem" to avoid
contaminating the decision workspace.
"""
from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.db.models import Decision, DecisionChatSession


def ensure_session_linked(
    db: Session,
    decision_id: UUID,
    session_id: str,
    agent_domain: str,
) -> None:
    """
    Require that the decision exists and the session is tagged to it.
    If no DecisionChatSession row exists, create one (idempotent).
    Raises if decision not found.
    """
    d = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if not d:
        raise ValueError(f"Decision not found: {decision_id}")
    if agent_domain not in ("cfo", "cmo", "coo", "cto"):
        raise ValueError(f"Invalid agent_domain: {agent_domain}")
    rec = db.query(DecisionChatSession).filter(
        DecisionChatSession.decision_id == decision_id,
        DecisionChatSession.session_id == session_id,
        DecisionChatSession.agent_domain == agent_domain,
    ).first()
    if not rec:
        rec = DecisionChatSession(
            decision_id=decision_id,
            session_id=session_id,
            agent_domain=agent_domain,
        )
        db.add(rec)
        db.flush()


def check_new_problem_heuristic(message: str) -> Optional[dict]:
    """
    Simple heuristic v1: if the message clearly asks for a new diagnosis or
    unrelated topic, return a guard response so the route can avoid writing
    into decision-scoped chat and can tell the client to start a new decision.
    Returns None if the message is fine to process in the current decision scope.
    """
    if not message or not message.strip():
        return None
    lower = message.strip().lower()
    # Phrases that suggest user wants a new diagnosis / new problem
    new_problem_phrases = [
        "new diagnosis",
        "new analysis",
        "different problem",
        "different topic",
        "another company",
        "different business",
        "start over",
        "run diagnose again",
        "run a new diagnose",
    ]
    for phrase in new_problem_phrases:
        if phrase in lower:
            return {
                "requires_new_decision": True,
                "reason": "Message appears to request a new diagnosis or different scope.",
                "suggested_next": "run_diagnose",
            }
    return None
