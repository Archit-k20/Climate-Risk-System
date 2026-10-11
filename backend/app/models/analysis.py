from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    JSON,
    CheckConstraint,
)
from app.db.base import Base


class Analysis(Base):
    __tablename__ = "analyses"
    __table_args__ = (
        CheckConstraint(
            "status IN ('queued','running','completed','inconclusive','failed')",
            name="analysis_status",
        ),
        CheckConstraint(
            "score IS NULL OR (score >= 0 AND score <= 100)",
            name="analysis_score_range",
        ),
    )
    id = Column(String, primary_key=True)
    image_id = Column(Integer, ForeignKey("images.id"), nullable=False, unique=True)
    task_id = Column(String, unique=True, nullable=False)
    status = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False)
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True), index=True)
    land_class = Column(String)
    risk_level = Column(String)
    risk_type = Column(String)
    score = Column(Float)
    description = Column(String)
    model_votes = Column(JSON)
    model_agreement = Column(Integer)
    narrative = Column(String)
    narrative_source = Column(String)
    narrative_reason = Column(String)
    failure_reason = Column(String)
    model_version = Column(String)
