from pydantic import BaseModel, ConfigDict
from datetime import datetime


class ImageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    filename: str
    uploaded_at: datetime


from typing import Literal
from pydantic import Field


class AnalysisResponse(BaseModel):
    id: str
    image_id: int
    filename: str
    uploaded_at: datetime
    completed_at: datetime | None = None
    created_at: datetime | None = None
    task_id: str | None = None
    status: Literal["queued", "running", "completed", "inconclusive", "failed"]
    land_class: str | None = None
    risk_level: Literal["low", "medium", "high"] | None = None
    risk_type: str | None = None
    score: float | None = Field(default=None, ge=0, le=100)
    description: str | None = None
    model_votes: dict[str, str] | None = None
    model_agreement: int | None = Field(default=None, ge=1, le=3)
    model_version: str | None = None
    narrative: str | None = None
    narrative_source: Literal["gemini", "template"] | None = None
    narrative_reason: str | None = None
    failure_reason: str | None = None
    location: str | None = None
    provenance: Literal["model", "legacy"]


class TaskResponse(BaseModel):
    status: str
    details: str | None = None
    result: AnalysisResponse


class AnalysisSubmission(BaseModel):
    task_id: str
    status: str
