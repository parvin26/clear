"""Advisor workspace API: read-only decision context + structured reviews."""
from uuid import UUID
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.database import get_db
from app.db.models import (
    Decision,
    Enterprise,
    EnterpriseMember,
    AdvisorReviewRequest,
    AdvisorReview,
)
from app.clear.members import resolve_role_by_token
from app.governance.ledger_service import get_latest_artifact_for_decision, _derive_status_from_ledger
from app.governance.readiness import compute_readiness
from app.clear.timeline_service import get_enterprise_timeline


def _advisor_email(
    request: Request,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Resolve advisor email: JWT (current user) or ?token= invite token."""
    # 1) Try JWT
    auth = request.headers.get("Authorization")
    if auth and auth.startswith("Bearer "):
        from app.auth.tokens import decode_token
        from app.auth import service as auth_service
        payload = decode_token(auth[7:])
        if payload and payload.get("type") == "access":
            try:
                uid = int(payload["sub"])
                user = auth_service.get_user_by_id(db, uid)
                if user and user.email:
                    email = (user.email or "").strip().lower()
                    if email:
                        # Verify this user is an advisor (member of some enterprise as advisor)
                        m = db.query(EnterpriseMember).filter(
                            EnterpriseMember.email == email,
                            EnterpriseMember.role == "advisor",
                        ).first()
                        if m:
                            return email
            except (KeyError, TypeError, ValueError):
                pass
    # 2) Try invite token
    if token:
        resolved = resolve_role_by_token(db, token)
        if resolved and resolved.get("role") == "advisor":
            e = (resolved.get("email") or "").strip().lower()
            if e:
                return e
    raise HTTPException(
        status_code=401,
        detail="Advisor identity required. Use ?token= invite token from your invitation email, or sign in with an advisor account.",
    )


router = APIRouter(prefix="/api/clear/advisor", tags=["Advisor workspace"])


@router.get("/me")
def advisor_me(
    db: Session = Depends(get_db),
    advisor_email: str = Depends(_advisor_email),
):
    """Advisor home: pending review requests, enterprises they're attached to, recent reviews."""
    pending = (
        db.query(AdvisorReviewRequest)
        .filter(
            AdvisorReviewRequest.advisor_email == advisor_email,
            AdvisorReviewRequest.status == "pending",
        )
        .order_by(desc(AdvisorReviewRequest.requested_at))
        .all()
    )
    enterprises_for_advisor = (
        db.query(Enterprise)
        .join(EnterpriseMember, EnterpriseMember.enterprise_id == Enterprise.id)
        .filter(EnterpriseMember.email == advisor_email, EnterpriseMember.role == "advisor")
        .distinct()
        .all()
    )
    ent_list = [{"id": e.id, "name": e.name} for e in enterprises_for_advisor]

    recent_reviews = (
        db.query(AdvisorReview)
        .filter(AdvisorReview.advisor_email == advisor_email)
        .order_by(desc(AdvisorReview.created_at))
        .limit(5)
        .all()
    )

    def _request_row(r: AdvisorReviewRequest) -> dict:
        ent = db.query(Enterprise).filter(Enterprise.id == r.enterprise_id).first()
        return {
            "id": r.id,
            "decision_id": str(r.decision_id),
            "enterprise_id": r.enterprise_id,
            "enterprise_name": ent.name if ent else None,
            "requested_by": r.requested_by,
            "requested_at": r.requested_at.isoformat() if r.requested_at else None,
            "due_date": r.due_date.isoformat() if r.due_date else None,
            "status": r.status,
        }

    def _review_row(r: AdvisorReview) -> dict:
        return {
            "id": r.id,
            "decision_id": str(r.decision_id),
            "headline_assessment": r.headline_assessment,
            "confidence": r.confidence,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }

    return {
        "email": advisor_email,
        "pending_review_requests": [_request_row(r) for r in pending],
        "enterprises": ent_list,
        "recent_reviews": [_review_row(r) for r in recent_reviews],
    }


@router.get("/enterprises")
def list_advisor_enterprises(
    db: Session = Depends(get_db),
    advisor_email: str = Depends(_advisor_email),
):
    """List enterprises this advisor is attached to."""
    rows = (
        db.query(Enterprise)
        .join(EnterpriseMember, EnterpriseMember.enterprise_id == Enterprise.id)
        .filter(EnterpriseMember.email == advisor_email, EnterpriseMember.role == "advisor")
        .distinct()
        .all()
    )
    return [{"id": e.id, "name": e.name, "sector": e.sector, "geography": e.geography} for e in rows]


@router.get("/enterprises/{enterprise_id}/decisions")
def list_advisor_enterprise_decisions(
    enterprise_id: int,
    db: Session = Depends(get_db),
    advisor_email: str = Depends(_advisor_email),
):
    """List decisions for this enterprise that the advisor has access to."""
    # Check advisor is member of this enterprise
    mem = db.query(EnterpriseMember).filter(
        EnterpriseMember.enterprise_id == enterprise_id,
        EnterpriseMember.email == advisor_email,
        EnterpriseMember.role == "advisor",
    ).first()
    if not mem:
        raise HTTPException(status_code=404, detail="Enterprise not found or access denied")
    decisions = (
        db.query(Decision)
        .filter(Decision.enterprise_id == enterprise_id)
        .order_by(desc(Decision.created_at))
        .all()
    )
    out = []
    for d in decisions:
        art = get_latest_artifact_for_decision(db, d.decision_id)
        status = _derive_status_from_ledger(db, d.decision_id) if art else "draft"
        snap = (art.canonical_json or {}).get("decision_snapshot") or {} if art else {}
        out.append({
            "decision_id": str(d.decision_id),
            "enterprise_id": d.enterprise_id,
            "current_status": status,
            "created_at": d.created_at.isoformat() if d.created_at else None,
            "decision_statement": (snap.get("decision_statement") or "")[:200],
        })
    return out


@router.get("/decisions/{decision_id}")
def get_advisor_decision(
    decision_id: UUID,
    db: Session = Depends(get_db),
    advisor_email: str = Depends(_advisor_email),
):
    """Get decision detail for advisor (read-only). Access: advisor must be member of decision's enterprise or have a review request."""
    d = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Decision not found")
    # Access: enterprise member (advisor) or has advisor_review_request for this decision
    if d.enterprise_id:
        mem = db.query(EnterpriseMember).filter(
            EnterpriseMember.enterprise_id == d.enterprise_id,
            EnterpriseMember.email == advisor_email,
            EnterpriseMember.role == "advisor",
        ).first()
        if mem:
            pass  # allowed
        else:
            req = db.query(AdvisorReviewRequest).filter(
                AdvisorReviewRequest.decision_id == decision_id,
                AdvisorReviewRequest.advisor_email == advisor_email,
            ).first()
            if not req:
                raise HTTPException(status_code=404, detail="Decision not found or access denied")
    return _decision_to_out(db, d)


def _decision_to_out(db: Session, d: Decision) -> dict:
    """Build DecisionOut-like dict for a decision (used by advisor read-only view)."""
    from app.governance.ledger_service import get_latest_artifact_for_decision, _artifact_count_for_decision, _derive_status_from_ledger
    art = get_latest_artifact_for_decision(db, d.decision_id)
    version_count = _artifact_count_for_decision(db, d.decision_id)
    status = _derive_status_from_ledger(db, d.decision_id) if art else "draft"
    return {
        "decision_id": str(d.decision_id),
        "enterprise_id": d.enterprise_id,
        "current_status": status,
        "current_artifact_version": version_count,
        "created_at": d.created_at.isoformat() if d.created_at else None,
        "updated_at": (d.updated_at or d.created_at).isoformat() if (d.updated_at or d.created_at) else None,
        "latest_artifact": art.canonical_json if art else None,
        "latest_artifact_hash": None,
        "responsible_owner": getattr(d, "responsible_owner", None),
        "expected_outcome": getattr(d, "expected_outcome", None),
        "outcome_review_reminder": getattr(d, "outcome_review_reminder", None),
        "outcome_review_notes": getattr(d, "outcome_review_notes", None),
    }


@router.get("/decisions/{decision_id}/reviews")
def list_advisor_reviews(
    decision_id: UUID,
    db: Session = Depends(get_db),
    advisor_email: str = Depends(_advisor_email),
):
    """List this advisor's reviews for the decision (for 'Your latest review' / history)."""
    _check_advisor_decision_access(db, decision_id, advisor_email)
    rows = (
        db.query(AdvisorReview)
        .filter(AdvisorReview.decision_id == decision_id, AdvisorReview.advisor_email == advisor_email)
        .order_by(desc(AdvisorReview.created_at))
        .all()
    )
    return [
        {
            "id": r.id,
            "decision_id": str(r.decision_id),
            "headline_assessment": r.headline_assessment,
            "what_looks_strong": r.what_looks_strong,
            "what_worries_most": r.what_worries_most,
            "next_4_6_weeks": r.next_4_6_weeks,
            "confidence": r.confidence,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]


@router.post("/decisions/{decision_id}/review")
def submit_advisor_review(
    decision_id: UUID,
    body: dict,  # headline_assessment, what_looks_strong, what_worries_most, next_4_6_weeks, confidence
    db: Session = Depends(get_db),
    advisor_email: str = Depends(_advisor_email),
):
    """Submit a structured advisor review. Marks any pending review request for this decision as completed."""
    _check_advisor_decision_access(db, decision_id, advisor_email)
    r = AdvisorReview(
        decision_id=decision_id,
        advisor_email=advisor_email,
        headline_assessment=(body.get("headline_assessment") or "").strip() or None,
        what_looks_strong=(body.get("what_looks_strong") or "").strip() or None,
        what_worries_most=(body.get("what_worries_most") or "").strip() or None,
        next_4_6_weeks=(body.get("next_4_6_weeks") or "").strip() or None,
        confidence=(body.get("confidence") or "").strip() or None,
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    # Mark pending review request as completed
    db.query(AdvisorReviewRequest).filter(
        AdvisorReviewRequest.decision_id == decision_id,
        AdvisorReviewRequest.advisor_email == advisor_email,
        AdvisorReviewRequest.status == "pending",
    ).update({"status": "completed"})
    db.commit()
    return {
        "id": r.id,
        "decision_id": str(r.decision_id),
        "headline_assessment": r.headline_assessment,
        "confidence": r.confidence,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }


def _check_advisor_decision_access(db: Session, decision_id: UUID, advisor_email: str) -> None:
    d = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Decision not found")
    if d.enterprise_id:
        mem = db.query(EnterpriseMember).filter(
            EnterpriseMember.enterprise_id == d.enterprise_id,
            EnterpriseMember.email == advisor_email,
            EnterpriseMember.role == "advisor",
        ).first()
        if mem:
            return
    req = db.query(AdvisorReviewRequest).filter(
        AdvisorReviewRequest.decision_id == decision_id,
        AdvisorReviewRequest.advisor_email == advisor_email,
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Decision not found or access denied")
