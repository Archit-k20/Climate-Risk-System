from sqlalchemy import Column, Integer, Float, ForeignKey, String
from app.db.base import Base

class RiskScore(Base):
    __tablename__ = "risk_scores"

    id       = Column(Integer, primary_key=True, index=True)
    image_id = Column(Integer, ForeignKey("images.id"), nullable=False)
    score    = Column(Float, nullable=False)
    # New fields to store the actual ML analysis result
    risk_level = Column(String, nullable=True)   # 'Low', 'Medium', 'High'
    risk_type  = Column(String, nullable=True)   # 'Flood Risk', 'Wildfire Risk' etc.
    land_class = Column(String, nullable=True)   # 'Forest', 'River' etc.