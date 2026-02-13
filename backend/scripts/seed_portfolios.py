"""
Seed dummy portfolios, enterprises, and decisions from seed_portfolios_data.json.
Run from backend dir: python -m scripts.seed_portfolios
Or: python scripts/seed_portfolios.py (with PYTHONPATH=.)
Creates: institutions, portfolios, enterprises, portfolio_enterprises, decisions + artifacts, outcome_reviews.
"""
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

# Add backend to path so app imports work
_backend = Path(__file__).resolve().parent.parent
if str(_backend) not in sys.path:
    sys.path.insert(0, str(_backend))
os.chdir(_backend)

from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import (
    Institution,
    Portfolio,
    PortfolioEnterprise,
    Enterprise,
    OutcomeReview,
)
from app.governance.ledger_service import create_decision

# Readiness band -> number of milestones (out of 5) with status "done" so compute_readiness returns that band.
# Nascent: rate < 0.3 or reviews == 0 -> use 0 done, 0 reviews for Nascent without last_review_date.
# Emerging: rate in [0.3, 0.7) and reviews >= 1 -> 2 done, 1 review.
# Institutionalizing: rate >= 0.7 -> 4 done, 1 review.
READINESS_MILESTONE_DONE_COUNT = {
    "Nascent": 0,
    "Emerging": 2,
    "Institutionalizing": 4,
}
TOTAL_MILESTONES = 5


def build_artifact(
    decision_statement: str,
    primary_domain: str,
    readiness_band: str,
    has_committed_plan: bool,
) -> dict:
    """Build initial artifact dict for create_decision. Matches shape expected by portfolio_service and readiness."""
    done_count = READINESS_MILESTONE_DONE_COUNT.get(readiness_band, 0)
    milestones = []
    for i in range(TOTAL_MILESTONES):
        status = "done" if i < done_count else "pending"
        milestones.append({
            "id": f"m{i + 1}",
            "title": f"Key step {i + 1}",
            "description": "Seed milestone.",
            "status": status,
        })
    return {
        "problem_statement": decision_statement,
        "decision_snapshot": {"decision_statement": decision_statement},
        "synthesis_summary": {
            "primary_domain": primary_domain,
            "emerging_decision": decision_statement,
            "decision_statement": decision_statement,
        },
        "governance": {
            "decision_type": "ops",
            "risk_tier": "medium",
            "required_approvers": ["founder"],
            "approval_status": "approved",
        },
        "emr": {
            "plan_committed": has_committed_plan,
            "milestones": milestones,
            "metrics": [],
            "config": {"cadence": "weekly", "horizon_label": "4–8 weeks"},
            "must_do_recommended_ids": [],
        },
        "capability_gaps": [],
        "constraints": [{"id": "c1", "type": "context", "description": "Seed data."}],
        "options_considered": [{"id": "opt1", "title": "Primary path", "summary": decision_statement[:200]}],
        "chosen_option_id": "opt1",
        "action_plan": {"week": [], "month": [], "quarter": []},
    }


def load_data() -> list:
    """Load seed data from JSON file next to this script."""
    path = Path(__file__).resolve().parent / "seed_portfolios_data.json"
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def run_seed(db: Session, data: list) -> None:
    """Create institutions, portfolios, enterprises, decisions, portfolio_enterprises, outcome_reviews."""
    for profile in data:
        inst = Institution(
            name=profile["institution"]["name"],
            type=profile["institution"].get("type"),
        )
        db.add(inst)
        db.flush()

        port = Portfolio(
            institution_id=inst.id,
            name=profile["portfolio"]["name"],
        )
        db.add(port)
        db.flush()

        for ent_data in profile["enterprises"]:
            ent = Enterprise(
                name=ent_data["name"],
                sector=ent_data.get("sector"),
                geography=ent_data.get("geography"),
                operating_model=ent_data.get("operating_model"),
                size_band=ent_data.get("size_band"),
            )
            db.add(ent)
            db.flush()

            ld = ent_data.get("last_decision") or {}
            statement = (ld.get("decision_statement") or "Capability focus.")[:500]
            primary_domain = ld.get("primary_domain") or "coo"
            readiness_band = ld.get("readiness_band") or "Emerging"
            has_committed_plan = bool(ld.get("has_committed_plan"))
            last_review_date_str = ld.get("last_review_date")

            artifact = build_artifact(
                decision_statement=statement,
                primary_domain=primary_domain,
                readiness_band=readiness_band,
                has_committed_plan=has_committed_plan,
            )
            decision = create_decision(
                db,
                enterprise_id=ent.id,
                initial_artifact=artifact,
                actor_id="seed",
                actor_role="system",
            )

            db.add(
                PortfolioEnterprise(
                    portfolio_id=port.id,
                    enterprise_id=ent.id,
                )
            )

            if last_review_date_str:
                try:
                    review_dt = datetime.strptime(last_review_date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                    # OutcomeReview uses created_at for "last review date" in portfolio view
                    review = OutcomeReview(
                        decision_id=decision.decision_id,
                        summary="Outcome review (seed).",
                        created_at=review_dt,
                    )
                    db.add(review)
                except ValueError:
                    pass
            db.commit()
        # end for ent_data
        print(f"  Portfolio: {port.name} ({len(profile['enterprises'])} enterprises)")


def main():
    data = load_data()
    print(f"Seeding {len(data)} portfolios...")
    db = SessionLocal()
    try:
        run_seed(db, data)
        print("Done.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}", file=sys.stderr)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
