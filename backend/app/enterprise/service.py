"""Phase 2: Enterprise CRUD service."""
from typing import Optional, Any

from sqlalchemy.orm import Session

from app.db.models import Enterprise
from app.enterprise.schemas import EnterpriseCreate, EnterpriseUpdate


def get_or_create_enterprise_from_onboarding(db: Session, onboarding_context: dict[str, Any] | None) -> Optional[int]:
    """
    If onboarding has enough info (name + country or industry), get or create an Enterprise and return its id.
    Match by name + geography (country) to avoid duplicates. Used by diagnostic/run to attach decisions.
    """
    if not onboarding_context:
        return None
    name = (onboarding_context.get("company_name") or onboarding_context.get("name") or "").strip()
    country = (onboarding_context.get("country") or "").strip()
    industry = (onboarding_context.get("industry") or "").strip()
    company_size = (
        onboarding_context.get("company_size")
        or onboarding_context.get("companySize")
        or onboarding_context.get("company_size_band")
        or ""
    )
    if isinstance(company_size, (int, float)):
        company_size = str(company_size)
    if not name and not country and not industry:
        return None
    # Prefer name+country for match; else name; else create with whatever we have
    if name and country:
        ent = db.query(Enterprise).filter(Enterprise.name == name, Enterprise.geography == country).first()
    elif name:
        ent = db.query(Enterprise).filter(Enterprise.name == name).first()
    else:
        ent = None
    if ent:
        return ent.id
    ent = Enterprise(
        name=name or None,
        sector=industry or None,
        geography=country or None,
        size_band=company_size or None,
    )
    db.add(ent)
    db.flush()
    return ent.id


class EnterpriseService:
    @staticmethod
    def create(db: Session, data: EnterpriseCreate) -> Enterprise:
        ent = Enterprise(
            name=data.name,
            sector=data.sector,
            geography=data.geography,
            operating_model=data.operating_model,
            size_band=data.size_band,
            settings_json=data.settings_json,
        )
        db.add(ent)
        db.flush()
        return ent

    @staticmethod
    def get_by_id(db: Session, id: int) -> Optional[Enterprise]:
        return db.query(Enterprise).filter(Enterprise.id == id).first()

    @staticmethod
    def list_(db: Session, skip: int = 0, limit: int = 100):
        return db.query(Enterprise).order_by(Enterprise.id).offset(skip).limit(limit).all()

    @staticmethod
    def update(db: Session, id: int, data: EnterpriseUpdate) -> Optional[Enterprise]:
        ent = db.query(Enterprise).filter(Enterprise.id == id).first()
        if not ent:
            return None
        d = data.model_dump(exclude_unset=True)
        for k, v in d.items():
            setattr(ent, k, v)
        db.flush()
        return ent


enterprise_service = EnterpriseService()
