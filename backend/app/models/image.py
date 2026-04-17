from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.db.base import Base
from pgvector.sqlalchemy import Vector # type: ignore

class Image(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    embedding = Column(Vector(768))  
    uploaded_at = Column(DateTime(timezone=True), default=func.now())