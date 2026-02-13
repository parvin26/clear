"""Phase 2: Event-sourced execution and outcomes. Write only to decision_ledger_events; state derived by replay."""
from datetime import date, datetime
from uuid import UUID, uuid4
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.db.models import Decision, DecisionLedgerEvent
from app.schemas.clear.ledger import LedgerEventType


EXECUTION_EVENT_TYPES = (
    LedgerEventType.TASK_CREATED.value,
    LedgerEventType.TASK_UPDATED.value,
    LedgerEventType.MILESTONE_LOGGED.value,
    LedgerEventType.OUTCOME_RECORDED.value,
)


def _require_decision(db: Session, decision_id: UUID) -> None:
    d = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if not d:
        raise ValueError("Decision not found")


def append_task_created(
    db: Session,
    decision_id: UUID,
    *,
    title: str,
    owner: Optional[str] = None,
    due_date: Optional[date] = None,
    status: str = "planned",
    action_plan_ref: Optional[str] = None,
    meta_json: Optional[dict] = None,
    actor_id: Optional[str] = None,
    actor_role: Optional[str] = None,
) -> UUID:
    """Emit TASK_CREATED; return task_key (uuid) for later TASK_UPDATED / MILESTONE_LOGGED."""
    _require_decision(db, decision_id)
    task_key = uuid4()
    payload = {
        "task_key": str(task_key),
        "title": title,
        "owner": owner,
        "due_date": due_date.isoformat() if due_date else None,
        "status": status,
        "action_plan_ref": action_plan_ref,
        "meta_json": meta_json,
    }
    db.add(
        DecisionLedgerEvent(
            event_id=uuid4(),
            decision_id=decision_id,
            event_type=LedgerEventType.TASK_CREATED.value,
            payload=payload,
            actor_id=actor_id,
            actor_role=actor_role,
        )
    )
    db.flush()
    return task_key


def append_task_updated(
    db: Session,
    decision_id: UUID,
    task_key: UUID,
    changes: dict[str, Any],
    *,
    actor_id: Optional[str] = None,
    actor_role: Optional[str] = None,
) -> None:
    """Emit TASK_UPDATED (e.g. status, due_date, owner). No mutable row update."""
    _require_decision(db, decision_id)
    payload = {"task_key": str(task_key), "changes": changes}
    db.add(
        DecisionLedgerEvent(
            event_id=uuid4(),
            decision_id=decision_id,
            event_type=LedgerEventType.TASK_UPDATED.value,
            payload=payload,
            actor_id=actor_id,
            actor_role=actor_role,
        )
    )
    db.flush()


def append_milestone_logged(
    db: Session,
    decision_id: UUID,
    task_key: UUID,
    milestone_type: str,
    *,
    evidence_text: Optional[str] = None,
    evidence_url: Optional[str] = None,
    metrics_json: Optional[dict] = None,
    actor_id: Optional[str] = None,
    actor_role: Optional[str] = None,
) -> None:
    """Emit MILESTONE_LOGGED. No mutable milestone row."""
    _require_decision(db, decision_id)
    payload = {
        "task_key": str(task_key),
        "milestone_type": milestone_type,
        "evidence_text": evidence_text,
        "evidence_url": evidence_url,
        "metrics_json": metrics_json,
    }
    db.add(
        DecisionLedgerEvent(
            event_id=uuid4(),
            decision_id=decision_id,
            event_type=LedgerEventType.MILESTONE_LOGGED.value,
            payload=payload,
            actor_id=actor_id,
            actor_role=actor_role,
        )
    )
    db.flush()


def append_outcome_recorded(
    db: Session,
    decision_id: UUID,
    outcome_type: str,
    metrics_json: dict[str, Any],
    *,
    notes: Optional[str] = None,
    actor_id: Optional[str] = None,
    actor_role: Optional[str] = None,
) -> None:
    """Emit OUTCOME_RECORDED. No mutable outcome row."""
    _require_decision(db, decision_id)
    payload = {"outcome_type": outcome_type, "metrics_json": metrics_json, "notes": notes}
    db.add(
        DecisionLedgerEvent(
            event_id=uuid4(),
            decision_id=decision_id,
            event_type=LedgerEventType.OUTCOME_RECORDED.value,
            payload=payload,
            actor_id=actor_id,
            actor_role=actor_role,
        )
    )
    db.flush()


def _events_for_decision(
    db: Session,
    decision_id: UUID,
    event_types: tuple[str, ...] = EXECUTION_EVENT_TYPES,
) -> list[DecisionLedgerEvent]:
    return (
        db.query(DecisionLedgerEvent)
        .filter(
            DecisionLedgerEvent.decision_id == decision_id,
            DecisionLedgerEvent.event_type.in_(event_types),
        )
        .order_by(DecisionLedgerEvent.created_at)
        .all()
    )


def derived_tasks(db: Session, decision_id: UUID) -> list[dict[str, Any]]:
    """Replay TASK_CREATED + TASK_UPDATED to derive current task list."""
    events = _events_for_decision(
        db, decision_id, (LedgerEventType.TASK_CREATED.value, LedgerEventType.TASK_UPDATED.value)
    )
    tasks: dict[str, dict] = {}
    for ev in events:
        if ev.event_type == LedgerEventType.TASK_CREATED.value and ev.payload:
            key = ev.payload.get("task_key")
            if key:
                tasks[key] = {
                    "task_key": key,
                    "title": ev.payload.get("title", ""),
                    "owner": ev.payload.get("owner"),
                    "due_date": ev.payload.get("due_date"),
                    "status": ev.payload.get("status", "planned"),
                    "action_plan_ref": ev.payload.get("action_plan_ref"),
                    "meta_json": ev.payload.get("meta_json"),
                    "created_at": ev.created_at.isoformat() if ev.created_at else None,
                }
        elif ev.event_type == LedgerEventType.TASK_UPDATED.value and ev.payload:
            key = ev.payload.get("task_key")
            changes = ev.payload.get("changes") or {}
            if key and key in tasks:
                for k, v in changes.items():
                    if k == "due_date" and hasattr(v, "isoformat"):
                        v = v.isoformat() if v else None
                    tasks[key][k] = v
    return list(tasks.values())


def derived_timeline(db: Session, decision_id: UUID, limit: int = 200) -> list[dict[str, Any]]:
    """Ordered execution/outcome events for a decision."""
    events = _events_for_decision(db, decision_id)[-limit:]
    return [
        {
            "event_id": str(ev.event_id),
            "event_type": ev.event_type,
            "payload": ev.payload,
            "created_at": ev.created_at.isoformat() if ev.created_at else None,
        }
        for ev in events
    ]


def derived_outcomes(db: Session, decision_id: UUID) -> list[dict[str, Any]]:
    """Outcomes derived from OUTCOME_RECORDED events."""
    events = _events_for_decision(
        db, decision_id, (LedgerEventType.OUTCOME_RECORDED.value,)
    )
    return [
        {
            "outcome_type": ev.payload.get("outcome_type") if ev.payload else None,
            "metrics_json": ev.payload.get("metrics_json") if ev.payload else None,
            "notes": ev.payload.get("notes") if ev.payload else None,
            "created_at": ev.created_at.isoformat() if ev.created_at else None,
        }
        for ev in events
    ]
