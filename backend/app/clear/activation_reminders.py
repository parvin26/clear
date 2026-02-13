"""
Send activation nudge emails for enterprises on Day 2, 4, 7, 10, 12.
Skips if step already complete or reminder already sent for that day.
Uses first enterprise member (founder preferred) as recipient.
"""
import asyncio
import logging
from sqlalchemy.orm import Session

from app.db.models import Enterprise, EnterpriseMember, ActivationReminderSent
from app.clear.activation import compute_activation_for_enterprise
from app.auth.zepto_client import send_activation_reminder_email, NUDGE_MESSAGES

logger = logging.getLogger(__name__)

NUDGE_DAYS = (2, 4, 7, 10, 12)
NUDGE_DAY_TO_STEP = {
    2: "diagnostic",
    4: "finalize",
    7: "milestones",
    10: "milestones",
    12: "review",
}


def _first_member_email(db: Session, enterprise_id: int) -> str | None:
    """First member email (prefer founder)."""
    founder = (
        db.query(EnterpriseMember)
        .filter(EnterpriseMember.enterprise_id == enterprise_id, EnterpriseMember.role == "founder")
        .order_by(EnterpriseMember.created_at.asc())
        .first()
    )
    if founder:
        return (founder.email or "").strip() or None
    first = (
        db.query(EnterpriseMember)
        .filter(EnterpriseMember.enterprise_id == enterprise_id)
        .order_by(EnterpriseMember.created_at.asc())
        .first()
    )
    return (first.email or "").strip() if first else None


def _already_sent(db: Session, enterprise_id: int, nudge_day: int) -> bool:
    return (
        db.query(ActivationReminderSent)
        .filter(
            ActivationReminderSent.enterprise_id == enterprise_id,
            ActivationReminderSent.nudge_day == nudge_day,
        )
        .first()
        is not None
    )


async def run_activation_reminders(db: Session) -> dict[str, int]:
    """
    For each enterprise: if days_since_start in (2,4,7,10,12), step not complete, and not already sent,
    send reminder to first member and record. Returns { "sent": n, "skipped": m }.
    """
    sent = 0
    skipped = 0
    enterprises = db.query(Enterprise).all()
    for ent in enterprises:
        activation = compute_activation_for_enterprise(db, ent.id)
        if activation.get("all_complete"):
            continue
        days = activation.get("days_since_start", 0)
        if days not in NUDGE_DAYS:
            continue
        step_for_day = NUDGE_DAY_TO_STEP.get(days)
        if step_for_day and step_for_day in (activation.get("completed_steps") or []):
            skipped += 1
            continue
        if _already_sent(db, ent.id, days):
            skipped += 1
            continue
        to_email = _first_member_email(db, ent.id)
        if not to_email:
            logger.info("Activation reminder enterprise_id=%s day=%s: no member email, skip", ent.id, days)
            skipped += 1
            continue
        message = NUDGE_MESSAGES.get(days, "Complete your next CLEAR step.")
        ok, err = await send_activation_reminder_email(
            to_email,
            ent.name or "",
            days,
            message,
        )
        if ok:
            db.add(ActivationReminderSent(enterprise_id=ent.id, nudge_day=days))
            db.commit()
            sent += 1
            logger.info("Activation reminder sent enterprise_id=%s day=%s to %s", ent.id, days, to_email)
        else:
            logger.warning("Activation reminder send failed enterprise_id=%s day=%s: %s", ent.id, days, err)
            skipped += 1
    return {"sent": sent, "skipped": skipped}
