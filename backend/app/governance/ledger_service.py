"""Append-only ledger service. State derived from ledger + decision_artifacts; no mutable decision fields."""
import logging
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.db.models import Decision, DecisionLedgerEvent, DecisionArtifact, Enterprise
from app.governance.validator import governance_completeness_errors
from app.governance.canonicalize import canonicalize_and_hash
from app.schemas.clear.ledger import LedgerEventType, DerivedDecisionStatus

logger = logging.getLogger(__name__)


class LedgerServiceError(Exception):
    """Governance rule or validation error."""
    pass


def _derive_status_from_ledger(db: Session, decision_id: UUID) -> str:
    """Compute current status from ledger event sequence (last relevant event wins)."""
    events = (
        db.query(DecisionLedgerEvent)
        .filter(DecisionLedgerEvent.decision_id == decision_id)
        .order_by(DecisionLedgerEvent.created_at.desc())
        .all()
    )
    for ev in events:
        if ev.event_type == LedgerEventType.DECISION_ARCHIVED.value:
            return DerivedDecisionStatus.ARCHIVED.value
        if ev.event_type == LedgerEventType.OUTCOME_CAPTURED.value:
            return DerivedDecisionStatus.OUTCOME_TRACKED.value
        if ev.event_type == LedgerEventType.IMPLEMENTATION_COMPLETED.value:
            return DerivedDecisionStatus.IMPLEMENTED.value
        if ev.event_type == LedgerEventType.IMPLEMENTATION_STARTED.value:
            return DerivedDecisionStatus.IN_PROGRESS.value
        if ev.event_type == LedgerEventType.FINALIZATION_ACKNOWLEDGED.value:
            return DerivedDecisionStatus.SIGNED.value
        if ev.event_type == LedgerEventType.ARTIFACT_FINALIZED.value:
            return DerivedDecisionStatus.FINALIZED.value
    return DerivedDecisionStatus.DRAFT.value


def _latest_artifact_for_decision(db: Session, decision_id: UUID) -> DecisionArtifact | None:
    """Latest artifact (by created_at) for this decision."""
    return (
        db.query(DecisionArtifact)
        .filter(DecisionArtifact.decision_id == decision_id)
        .order_by(DecisionArtifact.created_at.desc())
        .limit(1)
        .first()
    )


def _artifact_count_for_decision(db: Session, decision_id: UUID) -> int:
    return db.query(DecisionArtifact).filter(DecisionArtifact.decision_id == decision_id).count()


def create_decision(
    db: Session,
    enterprise_id: int | None = None,
    initial_artifact: dict | None = None,
    actor_id: str | None = None,
    actor_role: str | None = None,
) -> Decision:
    """
    Create decision + DECISION_INITIATED event. Optionally insert first artifact (ARTIFACT_DRAFT_CREATED).
    No mutable status/version on decisions table.
    """
    decision_uuid = uuid4()
    decision = Decision(
        decision_id=decision_uuid,
        enterprise_id=enterprise_id,
    )
    db.add(decision)
    db.flush()
    event_id = uuid4()
    db.add(
        DecisionLedgerEvent(
            event_id=event_id,
            decision_id=decision_uuid,
            event_type=LedgerEventType.DECISION_INITIATED.value,
            payload={"actor_id": actor_id, "actor_role": actor_role},
            actor_id=actor_id,
            actor_role=actor_role,
        )
    )
    if initial_artifact is not None:
        _cstr, artifact_hash, artifact_dict = canonicalize_and_hash(initial_artifact)
        version_id = uuid4()
        artifact_id = uuid4()
        art = DecisionArtifact(
            artifact_id=artifact_id,
            decision_id=decision_uuid,
            enterprise_id=enterprise_id,
            version_id=version_id,
            supersedes_version_id=None,
            canonical_hash=artifact_hash,
            canonical_json=artifact_dict,
            created_by_actor_id=actor_id,
            created_by_actor_role=actor_role,
        )
        db.add(art)
        db.add(
            DecisionLedgerEvent(
                event_id=uuid4(),
                decision_id=decision_uuid,
                event_type=LedgerEventType.ARTIFACT_DRAFT_CREATED.value,
                version_id=version_id,
                payload={"reason": actor_id or "bootstrap"},
                actor_id=actor_id,
                actor_role=actor_role,
            )
        )
    db.commit()
    db.refresh(decision)
    return decision


def append_artifact_created(
    db: Session,
    decision_id: UUID,
    artifact: dict,
    reason_code: str | None = None,
    actor_id: str | None = None,
    actor_role: str | None = None,
    changed_fields_summary: dict | None = None,
) -> DecisionArtifact:
    """
    Insert new artifact version + ARTIFACT_DRAFT_CREATED or ARTIFACT_DRAFT_UPDATED.
    Only when derived status is draft. supersedes_version_id is computed server-side
    from the latest artifact (client must not supply it).
    """
    decision = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if not decision:
        raise LedgerServiceError("Decision not found")
    current = _derive_status_from_ledger(db, decision_id)
    if current != DerivedDecisionStatus.DRAFT.value:
        raise LedgerServiceError("Cannot add or change artifact when decision is not draft; use supersede flow")
    latest = _latest_artifact_for_decision(db, decision_id)
    supersedes_version_id: UUID | None = latest.version_id if latest else None
    _cstr, artifact_hash, artifact_dict = canonicalize_and_hash(artifact)
    version_id = uuid4()
    artifact_id = uuid4()
    art = DecisionArtifact(
        artifact_id=artifact_id,
        decision_id=decision_id,
        enterprise_id=decision.enterprise_id,
        version_id=version_id,
        supersedes_version_id=supersedes_version_id,
        canonical_hash=artifact_hash,
        canonical_json=artifact_dict,
        created_by_actor_id=actor_id,
        created_by_actor_role=actor_role,
    )
    db.add(art)
    event_type = LedgerEventType.ARTIFACT_DRAFT_UPDATED.value if supersedes_version_id else LedgerEventType.ARTIFACT_DRAFT_CREATED.value
    db.add(
        DecisionLedgerEvent(
            event_id=uuid4(),
            decision_id=decision_id,
            event_type=event_type,
            version_id=version_id,
            payload={"supersedes_version_id": str(supersedes_version_id) if supersedes_version_id else None},
            reason_code=reason_code,
            actor_id=actor_id,
            actor_role=actor_role,
            changed_fields_summary=changed_fields_summary,
        )
    )
    db.commit()
    db.refresh(art)
    return art


def finalize_decision(
    db: Session,
    decision_id: UUID,
    actor_id: str | None = None,
    actor_role: str | None = None,
) -> Decision:
    """
    Governance completeness + ≥1 evidence link; write ARTIFACT_FINALIZED for latest artifact.
    No mutation of artifact or decision table state.
    """
    decision = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if not decision:
        raise LedgerServiceError("Decision not found")
    current = _derive_status_from_ledger(db, decision_id)
    if current != DerivedDecisionStatus.DRAFT.value:
        raise LedgerServiceError("Only draft decisions can be finalized")
    latest = _latest_artifact_for_decision(db, decision_id)
    if not latest:
        raise LedgerServiceError("No artifact to finalize")
    errors = governance_completeness_errors(latest.canonical_json)
    if errors:
        raise LedgerServiceError("Governance completeness check failed: " + "; ".join(errors))
    from app.db.models import DecisionEvidenceLink
    evidence_count = db.query(DecisionEvidenceLink).filter(DecisionEvidenceLink.decision_id == decision_id).count()
    if evidence_count < 1:
        raise LedgerServiceError("At least one evidence link required before finalize")
    db.add(
        DecisionLedgerEvent(
            event_id=uuid4(),
            decision_id=decision_id,
            event_type=LedgerEventType.ARTIFACT_FINALIZED.value,
            version_id=latest.version_id,
            payload={"actor_id": actor_id, "actor_role": actor_role},
            reason_code=actor_id or "finalize",
            actor_id=actor_id,
            actor_role=actor_role,
        )
    )
    db.commit()
    db.refresh(decision)
    return decision


def sign_off_decision(
    db: Session,
    decision_id: UUID,
    actor_id: str,
    actor_role: str | None = None,
    comment: str | None = None,
) -> Decision:
    """Write FINALIZATION_ACKNOWLEDGED (mandatory acknowledgement). Derived status becomes signed."""
    decision = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if not decision:
        raise LedgerServiceError("Decision not found")
    current = _derive_status_from_ledger(db, decision_id)
    if current != DerivedDecisionStatus.FINALIZED.value:
        raise LedgerServiceError("Only finalized decisions can be signed off")
    db.add(
        DecisionLedgerEvent(
            event_id=uuid4(),
            decision_id=decision_id,
            event_type=LedgerEventType.FINALIZATION_ACKNOWLEDGED.value,
            payload={"comment": comment, "actor_id": actor_id, "actor_role": actor_role},
            actor_id=actor_id,
            actor_role=actor_role,
        )
    )
    db.commit()
    db.refresh(decision)
    return decision


def transition_status(
    db: Session,
    decision_id: UUID,
    to_status: DerivedDecisionStatus,
    reason_code: str | None = None,
    actor_id: str | None = None,
    actor_role: str | None = None,
) -> Decision:
    """Compatibility: write explicit ledger event (IMPLEMENTATION_STARTED, etc.) instead of mutating status."""
    decision = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if not decision:
        raise LedgerServiceError("Decision not found")
    event_type_map = {
        DerivedDecisionStatus.IN_PROGRESS: LedgerEventType.IMPLEMENTATION_STARTED.value,
        DerivedDecisionStatus.IMPLEMENTED: LedgerEventType.IMPLEMENTATION_COMPLETED.value,
        DerivedDecisionStatus.OUTCOME_TRACKED: LedgerEventType.OUTCOME_CAPTURED.value,
        DerivedDecisionStatus.ARCHIVED: LedgerEventType.DECISION_ARCHIVED.value,
    }
    event_type = event_type_map.get(to_status)
    if not event_type:
        raise LedgerServiceError(f"Transition to {to_status.value} not implemented via this endpoint; use finalize/sign_off")
    db.add(
        DecisionLedgerEvent(
            event_id=uuid4(),
            decision_id=decision_id,
            event_type=event_type,
            payload={"actor_id": actor_id, "actor_role": actor_role, "reason_code": reason_code},
            reason_code=reason_code,
            actor_id=actor_id,
            actor_role=actor_role,
        )
    )
    db.commit()
    db.refresh(decision)
    return decision


def get_latest_artifact_for_decision(db: Session, decision_id: UUID) -> DecisionArtifact | None:
    """Latest artifact (from decision_artifacts) for API responses."""
    return _latest_artifact_for_decision(db, decision_id)
