"""
Enterprise Health Score: execution discipline, decision governance, learning behavior.
Score 0-100 from three pillars. Does not measure financial size.
"""
from datetime import date, timedelta
from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.models import (
    Decision,
    DecisionExecutionMilestone,
    DecisionArtifact,
    DecisionEvidenceLink,
    OutcomeReview,
    DiagnosticRun,
    EnterpriseHealthSnapshot,
)
from app.governance.ledger_service import _derive_status_from_ledger

# Pillar max points
EXECUTION_MAX = 40   # 15 + 10 + 10 + 5
GOVERNANCE_MAX = 35  # 10 + 10 + 10 + 5
LEARNING_MAX = 25    # 10 + 10 + 5


def _is_finalized(db: Session, decision_id: UUID) -> bool:
    status = _derive_status_from_ledger(db, decision_id)
    return status in ("finalized", "signed", "in_progress", "implemented", "outcome_tracked", "archived")


def _decision_from_diagnostic(db: Session, decision_id: UUID) -> bool:
    return db.query(DiagnosticRun).filter(DiagnosticRun.decision_id == decision_id).limit(1).first() is not None


def _artifact_has_execution_plan(artifact_json: dict | None) -> bool:
    if not artifact_json:
        return False
    emr = artifact_json.get("emr") or {}
    milestones = emr.get("milestones") or []
    return len(milestones) >= 1


def compute_health_score(db: Session, enterprise_id: int) -> dict[str, Any]:
    """
    Compute current health score for an enterprise.
    Returns: total_score, execution_score, governance_score, learning_score, status_label, trend_direction.
    """
    decisions = db.query(Decision).filter(Decision.enterprise_id == enterprise_id).all()
    if not decisions:
        return _empty_score("No decisions")

    decision_ids = [d.decision_id for d in decisions]
    today = date.today()

    # --- Pillar 1: Execution Discipline (40) ---
    # Milestones completed on time (15), active decisions with progress (10), overdue ratio (10), evidence on completed (5)
    all_milestones = (
        db.query(DecisionExecutionMilestone)
        .filter(DecisionExecutionMilestone.decision_id.in_(decision_ids))
        .all()
    )
    total_milestones = len(all_milestones)
    completed_on_time = 0
    completed_late = 0
    overdue_count = 0
    completed_with_evidence = 0
    decisions_with_progress = set()

    for m in all_milestones:
        is_completed = (m.status or "").lower() == "completed"
        due = m.due_date
        if is_completed and due:
            if m.updated_at and m.updated_at.date() <= due:
                completed_on_time += 1
            else:
                completed_late += 1
        if due and not is_completed and due < today:
            overdue_count += 1
        if is_completed:
            # Check if this decision has any evidence link
            has_ev = db.query(DecisionEvidenceLink).filter(
                DecisionEvidenceLink.decision_id == m.decision_id
            ).limit(1).first() is not None
            if has_ev:
                completed_with_evidence += 1
            decisions_with_progress.add(m.decision_id)

    # Active = not draft; "active decisions with milestone progress"
    for d in decisions:
        if _derive_status_from_ledger(db, d.decision_id) != "draft":
            ms = [x for x in all_milestones if x.decision_id == d.decision_id]
            if any((x.status or "").lower() == "completed" for x in ms) or any((x.status or "").lower() in ("in_progress", "in progress") for x in ms):
                decisions_with_progress.add(d.decision_id)

    # Points: milestones on time (15)
    completed_total = completed_on_time + completed_late
    if total_milestones == 0:
        on_time_ratio = 0.0
    else:
        on_time_ratio = completed_on_time / total_milestones if total_milestones else 0
    if on_time_ratio >= 0.8:
        pts_on_time = 15
    elif on_time_ratio >= 0.5:
        pts_on_time = int(8 + (on_time_ratio - 0.5) / 0.3 * 7)
    else:
        pts_on_time = int(on_time_ratio * 10)
    pts_on_time = min(15, max(0, pts_on_time))

    # Active decisions with progress (10)
    active_decisions = [d for d in decisions if _derive_status_from_ledger(db, d.decision_id) != "draft"]
    n_active = len(active_decisions)
    n_with_progress = len(decisions_with_progress)
    pts_progress = min(10, int(10 * (n_with_progress / n_active)) if n_active else 0)

    # Overdue ratio (10): lower overdue ratio = higher points
    total_with_due = sum(1 for m in all_milestones if m.due_date)
    if total_with_due == 0:
        overdue_ratio = 0.0
    else:
        overdue_ratio = overdue_count / total_with_due
    pts_overdue = int(10 * (1 - min(1.0, overdue_ratio)))
    pts_overdue = min(10, max(0, pts_overdue))

    # Evidence on completed (5)
    if completed_total == 0:
        pts_evidence = 0
    else:
        pts_evidence = min(5, int(5 * completed_with_evidence / completed_total))
    execution_score = pts_on_time + pts_progress + pts_overdue + pts_evidence
    execution_score = min(EXECUTION_MAX, execution_score)

    # --- Pillar 2: Decision Governance (35) ---
    # Finalized vs draft (10), assigned owners (10), defined execution plans (10), from diagnostic (5)
    n_finalized = sum(1 for d in decisions if _is_finalized(db, d.decision_id))
    n_total = len(decisions)
    pts_finalized = int(10 * (n_finalized / n_total)) if n_total else 0

    n_with_owner = sum(1 for d in decisions if d.responsible_owner and d.responsible_owner.strip())
    pts_owner = int(10 * (n_with_owner / n_total)) if n_total else 0

    n_with_plan = 0
    for d in decisions:
        art = db.query(DecisionArtifact).filter(
            DecisionArtifact.decision_id == d.decision_id
        ).order_by(DecisionArtifact.created_at.desc()).limit(1).first()
        if art and _artifact_has_execution_plan(art.canonical_json or {}):
            n_with_plan += 1
    pts_plan = int(10 * (n_with_plan / n_total)) if n_total else 0

    n_from_diag = sum(1 for d in decisions if _decision_from_diagnostic(db, d.decision_id))
    pts_diag = min(5, int(5 * (n_from_diag / n_total)) if n_total else 0)

    governance_score = pts_finalized + pts_owner + pts_plan + pts_diag
    governance_score = min(GOVERNANCE_MAX, governance_score)

    # --- Pillar 3: Learning and Review (25) ---
    # Scheduled review (10), reviews on time (10), memory entries (5)
    n_with_reminder = sum(1 for d in decisions if d.outcome_review_reminder)
    pts_scheduled = int(10 * (n_with_reminder / n_total)) if n_total else 0

    reviews = db.query(OutcomeReview).filter(OutcomeReview.decision_id.in_(decision_ids)).all()
    n_reviews = len(reviews)
    n_decisions_with_review = len({r.decision_id for r in reviews})
    # "Reviews completed on time" proxy: decisions that have at least one review
    pts_reviews = int(10 * (n_decisions_with_review / n_total)) if n_total else 0

    # Institutional memory: outcome reviews with key_learnings
    n_memory = sum(1 for r in reviews if (r.key_learnings or "").strip())
    max_memory_expected = n_total * 2  # cap expectation
    pts_memory = min(5, int(5 * min(1.0, n_memory / max(1, max_memory_expected))))

    learning_score = pts_scheduled + pts_reviews + pts_memory
    learning_score = min(LEARNING_MAX, learning_score)

    total_score = execution_score + governance_score + learning_score
    total_score = min(100, total_score)

    status_label = _status_label(total_score)
    trend_direction = _get_trend(db, enterprise_id, total_score)

    return {
        "total_score": total_score,
        "execution_score": execution_score,
        "governance_score": governance_score,
        "learning_score": learning_score,
        "status_label": status_label,
        "trend_direction": trend_direction,
        "execution_max": EXECUTION_MAX,
        "governance_max": GOVERNANCE_MAX,
        "learning_max": LEARNING_MAX,
    }


def _empty_score(reason: str) -> dict[str, Any]:
    return {
        "total_score": 0,
        "execution_score": 0,
        "governance_score": 0,
        "learning_score": 0,
        "status_label": "No data",
        "trend_direction": None,
        "execution_max": EXECUTION_MAX,
        "governance_max": GOVERNANCE_MAX,
        "learning_max": LEARNING_MAX,
    }


def _status_label(total: int) -> str:
    if total >= 75:
        return "Strong execution discipline"
    if total >= 50:
        return "Developing"
    if total >= 25:
        return "Needs improvement"
    return "At risk"


def _get_trend(db: Session, enterprise_id: int, current_total: int) -> str | None:
    """Compare to previous month snapshot. Returns 'up' | 'down' | None."""
    prev = (
        db.query(EnterpriseHealthSnapshot)
        .filter(
            EnterpriseHealthSnapshot.enterprise_id == enterprise_id,
            EnterpriseHealthSnapshot.snapshot_date < date.today(),
        )
        .order_by(desc(EnterpriseHealthSnapshot.snapshot_date))
        .limit(1)
        .first()
    )
    if not prev or prev.score is None:
        return None
    if current_total > prev.score:
        return "up"
    if current_total < prev.score:
        return "down"
    return None
