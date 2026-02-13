"""
RTCO Phase 1: create decision record from a saved analysis. Internal, silent; no API change.
Phase 1B: canonical hash at write, ledger event DECISION_CREATED, evidence link to analysis.
"""
from uuid import uuid4
from sqlalchemy.orm import Session

from app.db.models import DecisionRecord, RtcoDecisionLedgerEvent, RtcoDecisionEvidenceLink
from app.governance_engine.decision_artifact import build_artifact_from_analysis
from app.governance.canonicalize import canonicalize, compute_canonical_hash

CANONICALIZATION_VERSION = "canon_v1"
EVENT_TYPE_CREATED = "DECISION_CREATED"


def create_decision_from_analysis(
    *,
    analysis_id: int,
    agent_domain: str,
    analysis_table: str,
    artifact_json: dict,
    db: Session,
) -> DecisionRecord:
    """
    Build artifact from analysis_json, insert one row into decision_records (version=1).
    Phase 1B: sets canonicalization_version, artifact_hash, artifact_canonical_json;
    appends DECISION_CREATED to rtco_decision_ledger_events and one row to rtco_decision_evidence_links.
    Returns the new DecisionRecord. Call after analysis save.
    """
    artifact = build_artifact_from_analysis(artifact_json, agent_domain)
    canonical_str = canonicalize(artifact)
    artifact_hash = compute_canonical_hash(artifact)
    decision_id = uuid4()
    rec = DecisionRecord(
        decision_id=decision_id,
        version=1,
        agent_domain=agent_domain,
        analysis_table=analysis_table,
        analysis_id=analysis_id,
        artifact_json=artifact,
        supersedes_id=None,
        canonicalization_version=CANONICALIZATION_VERSION,
        artifact_hash=artifact_hash,
        artifact_canonical_json=canonical_str,
    )
    db.add(rec)
    db.flush()
    # Append-only ledger event
    db.add(
        RtcoDecisionLedgerEvent(
            decision_id=decision_id,
            event_type=EVENT_TYPE_CREATED,
            event_payload={"analysis_table": analysis_table, "analysis_id": analysis_id},
        )
    )
    # Evidence link: source = analysis
    db.add(
        RtcoDecisionEvidenceLink(
            decision_id=decision_id,
            source_type="analysis",
            source_ref=f"{analysis_table}:{analysis_id}",
            meta_json=None,
        )
    )
    return rec
