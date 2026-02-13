"""Phase 2: Execution APIs — tasks + milestones."""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException

from app.db.database import get_db
from sqlalchemy.orm import Session
from app.execution.schemas import TaskCreate, TaskUpdate, TaskOut, MilestoneCreate, MilestoneOut
from app.execution.service import execution_service

router = APIRouter(prefix="/api", tags=["Execution (Phase 2)"])


@router.post("/decisions/{decision_id}/tasks", response_model=TaskOut)
def create_task(
    decision_id: UUID,
    data: TaskCreate,
    enterprise_id: int | None = None,
    db: Session = Depends(get_db),
):
    """Create a task for a decision."""
    t = execution_service.create_task(db, decision_id, data, enterprise_id=enterprise_id)
    db.commit()
    db.refresh(t)
    return t


@router.get("/decisions/{decision_id}/tasks", response_model=list[TaskOut])
def list_tasks(decision_id: UUID, db: Session = Depends(get_db)):
    """List tasks for a decision."""
    return execution_service.list_tasks_by_decision(db, decision_id)


@router.patch("/tasks/{task_id}", response_model=TaskOut)
def update_task(task_id: int, data: TaskUpdate, db: Session = Depends(get_db)):
    """Update a task."""
    t = execution_service.update_task(db, task_id, data)
    if not t:
        raise HTTPException(status_code=404, detail="Task not found")
    db.commit()
    db.refresh(t)
    return t


@router.post("/tasks/{task_id}/milestones", response_model=MilestoneOut)
def add_milestone(task_id: int, data: MilestoneCreate, db: Session = Depends(get_db)):
    """Add a milestone to a task."""
    m = execution_service.add_milestone(db, task_id, data)
    if not m:
        raise HTTPException(status_code=404, detail="Task not found")
    db.commit()
    db.refresh(m)
    return m


@router.get("/tasks/{task_id}/milestones", response_model=list[MilestoneOut])
def list_milestones(task_id: int, db: Session = Depends(get_db)):
    """List milestones for a task."""
    return execution_service.list_milestones(db, task_id)
