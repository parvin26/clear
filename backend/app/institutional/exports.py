"""Phase 4: Export decision/enterprise data (JSON, CSV; PDF stub)."""
import csv
import io
import json
from datetime import datetime
from uuid import UUID
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.db.models import (
    DecisionRecord,
    Decision,
    DecisionArtifact,
    DecisionLedgerEvent,
    DecisionEvidenceLink,
    ImplementationTask,
    Milestone,
    Outcome,
    CapabilityScore,
    FinancingReadiness,
    Enterprise,
)
from app.governance.execution_ledger_service import derived_tasks, derived_outcomes, derived_timeline


def _serialize(obj: Any) -> Any:
    if hasattr(obj, "isoformat"):
        return obj.isoformat()
    if isinstance(obj, UUID):
        return str(obj)
    if hasattr(obj, "__dict__") and not isinstance(obj, dict):
        return str(obj)
    return obj


def export_decision(
    db: Session,
    decision_id: UUID,
    format: str,
    scope: str = "full",
) -> tuple[str, str]:
    """
    Export a decision: versions chain (supersedes), artifact JSON, linked analyses, tasks+milestones, outcomes, capability scores, financing readiness.
    Returns (content: str, media_type or filename suffix).
    """
    # CLEAR decision (decisions table) or RTCO (decision_records)
    recs = db.query(DecisionRecord).filter(DecisionRecord.decision_id == decision_id).order_by(DecisionRecord.version).all()
    decision = db.query(Decision).filter(Decision.decision_id == decision_id).first()

    payload: dict[str, Any] = {
        "decision_id": str(decision_id),
        "exported_at": datetime.utcnow().isoformat() + "Z",
        "scope": scope,
    }
    if recs:
        payload["rtco_versions"] = [
            {
                "id": r.id,
                "version": r.version,
                "agent_domain": r.agent_domain,
                "analysis_table": r.analysis_table,
                "analysis_id": r.analysis_id,
                "artifact_hash": r.artifact_hash,
                "created_at": _serialize(r.created_at),
            }
            for r in recs
        ]
        if recs:
            payload["artifact_json"] = recs[-1].artifact_json
    if decision:
        artifacts = db.query(DecisionArtifact).filter(DecisionArtifact.decision_id == decision_id).order_by(DecisionArtifact.created_at).all()
        payload["clear_artifacts"] = [{"version_id": str(a.version_id), "canonical_hash": a.canonical_hash, "created_at": _serialize(a.created_at)} for a in artifacts]
        if artifacts:
            payload["latest_artifact_json"] = artifacts[-1].canonical_json
        events = db.query(DecisionLedgerEvent).filter(DecisionLedgerEvent.decision_id == decision_id).order_by(DecisionLedgerEvent.created_at).all()
        payload["ledger_events"] = [{"event_type": e.event_type, "payload": e.payload, "created_at": _serialize(e.created_at)} for e in events]
        evidence = db.query(DecisionEvidenceLink).filter(DecisionEvidenceLink.decision_id == decision_id).all()
        payload["evidence_links"] = [{"evidence_type": e.evidence_type, "source_ref": e.source_ref, "source_table": e.source_table} for e in evidence]

    tasks_derived = derived_tasks(db, decision_id) if decision else []
    outcomes_derived = derived_outcomes(db, decision_id) if decision else []
    payload["tasks_derived"] = tasks_derived
    payload["outcomes_derived"] = outcomes_derived

    if scope == "full":
        tasks_mutable = db.query(ImplementationTask).filter(ImplementationTask.decision_id == decision_id).all()
        payload["tasks_mutable"] = [
            {"id": t.id, "title": t.title, "status": t.status, "owner": t.owner}
            for t in tasks_mutable
        ]
        for t in tasks_mutable:
            milestones = db.query(Milestone).filter(Milestone.task_id == t.id).all()
            payload.setdefault("milestones_by_task", {})[str(t.id)] = [{"milestone_type": m.milestone_type, "logged_at": _serialize(m.logged_at)} for m in milestones]
        outcomes_mutable = db.query(Outcome).filter(Outcome.decision_id == decision_id).all()
        payload["outcomes_mutable"] = [{"outcome_type": o.outcome_type, "metrics_json": o.metrics_json, "measured_at": _serialize(o.measured_at)} for o in outcomes_mutable]

    cs = db.query(CapabilityScore).filter(CapabilityScore.decision_id == decision_id).order_by(CapabilityScore.computed_at.desc()).limit(10).all()
    payload["capability_scores"] = [{"capability_id": c.capability_id, "score": float(c.score), "computed_at": _serialize(c.computed_at)} for c in cs]
    fr = db.query(FinancingReadiness).filter(FinancingReadiness.decision_id == decision_id).order_by(FinancingReadiness.computed_at.desc()).first()
    if fr:
        payload["financing_readiness"] = {"readiness_score": float(fr.readiness_score), "flags_json": fr.flags_json, "rationale_json": fr.rationale_json}

    if format == "json":
        return json.dumps(payload, indent=2, default=_serialize), "application/json"
    if format == "csv":
        rows = [["key", "value"]]
        for k, v in payload.items():
            if isinstance(v, (list, dict)):
                rows.append([k, json.dumps(v, default=_serialize)])
            else:
                rows.append([k, str(v)])
        buf = io.StringIO()
        w = csv.writer(buf)
        w.writerows(rows)
        return buf.getvalue(), "text/csv"
    if format == "pdf":
        return _pdf_stub(payload), "application/pdf"
    return json.dumps(payload, indent=2, default=_serialize), "application/json"


def _pdf_stub(payload: dict) -> str:
    """Stub: return plain text representation (real PDF would require reportlab/weasyprint)."""
    return "PDF export stub. Use JSON or CSV.\n\n" + json.dumps({"decision_id": payload.get("decision_id"), "exported_at": payload.get("exported_at")}, indent=2)


def export_enterprise(
    db: Session,
    enterprise_id: int,
    format: str,
    scope: str = "full",
) -> tuple[str, str]:
    """Export enterprise: governance + execution + outcomes (and capability/financing if scope=full)."""
    from app.institutional.service import get_enterprise_snapshot
    snap = get_enterprise_snapshot(db, enterprise_id)
    if format == "json":
        return json.dumps(snap, indent=2, default=_serialize), "application/json"
    if format == "csv":
        rows = [["key", "value"]]
        for k, v in snap.items():
            rows.append([k, json.dumps(v, default=_serialize) if isinstance(v, (list, dict)) else str(v)])
        buf = io.StringIO()
        w = csv.writer(buf)
        w.writerows(rows)
        return buf.getvalue(), "text/csv"
    return json.dumps(snap, indent=2, default=_serialize), "application/json"
