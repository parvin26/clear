"""Phase 2: Task + milestone service."""
from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.models import ImplementationTask, Milestone
from app.execution.schemas import TaskCreate, TaskUpdate, MilestoneCreate


class ExecutionService:
    @staticmethod
    def create_task(
        db: Session,
        decision_id: UUID,
        data: TaskCreate,
        enterprise_id: Optional[int] = None,
    ) -> ImplementationTask:
        t = ImplementationTask(
            decision_id=decision_id,
            enterprise_id=enterprise_id,
            action_plan_ref=data.action_plan_ref,
            title=data.title,
            owner=data.owner,
            due_date=data.due_date,
            status=data.status or "planned",
            meta_json=data.meta_json,
        )
        db.add(t)
        db.flush()
        return t

    @staticmethod
    def list_tasks_by_decision(db: Session, decision_id: UUID):
        return (
            db.query(ImplementationTask)
            .filter(ImplementationTask.decision_id == decision_id)
            .order_by(desc(ImplementationTask.created_at))
            .all()
        )

    @staticmethod
    def get_task(db: Session, task_id: int) -> Optional[ImplementationTask]:
        return db.query(ImplementationTask).filter(ImplementationTask.id == task_id).first()

    @staticmethod
    def update_task(db: Session, task_id: int, data: TaskUpdate) -> Optional[ImplementationTask]:
        t = db.query(ImplementationTask).filter(ImplementationTask.id == task_id).first()
        if not t:
            return None
        d = data.model_dump(exclude_unset=True)
        for k, v in d.items():
            setattr(t, k, v)
        db.flush()
        return t

    @staticmethod
    def add_milestone(db: Session, task_id: int, data: MilestoneCreate) -> Optional[Milestone]:
        task = db.query(ImplementationTask).filter(ImplementationTask.id == task_id).first()
        if not task:
            return None
        m = Milestone(
            task_id=task_id,
            milestone_type=data.milestone_type,
            evidence_text=data.evidence_text,
            evidence_url=data.evidence_url,
            metrics_json=data.metrics_json,
        )
        db.add(m)
        db.flush()
        return m

    @staticmethod
    def list_milestones(db: Session, task_id: int):
        return (
            db.query(Milestone)
            .filter(Milestone.task_id == task_id)
            .order_by(Milestone.logged_at.desc())
            .all()
        )


execution_service = ExecutionService()
