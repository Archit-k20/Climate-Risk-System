"""The single source of truth for synchronous and queued analyses."""

from datetime import datetime, timezone, timedelta
from uuid import uuid4
import logging
from sqlalchemy import select
from app.core.config import settings
from app.models.analysis import Analysis
from app.models.image import Image
from app.models.risk import RiskScore
from app.services.llm_agent import generate_mitigation_report

log = logging.getLogger(__name__)
SCORES = {"Low": 22.0, "Medium": 55.0, "High": 82.0}
TERMINAL = {"completed", "inconclusive", "failed"}


def now():
    return datetime.now(timezone.utc)


def serialize(record, image):
    return {
        "id": record.id,
        "image_id": image.id,
        "filename": image.filename,
        "uploaded_at": image.uploaded_at,
        "status": record.status,
        "task_id": record.task_id,
        "created_at": record.created_at,
        "completed_at": record.completed_at,
        "land_class": record.land_class,
        "risk_level": record.risk_level.lower() if record.risk_level else None,
        "risk_type": record.risk_type,
        "score": record.score,
        "description": record.description,
        "model_votes": record.model_votes,
        "model_agreement": record.model_agreement,
        "narrative": record.narrative,
        "narrative_source": record.narrative_source,
        "narrative_reason": record.narrative_reason,
        "failure_reason": record.failure_reason,
        "model_version": record.model_version,
        "location": None,
        "provenance": "model",
    }


def reserve(db, image_id):
    # Serialize reservations for an image, including concurrent sync/async requests.
    image = db.execute(
        select(Image).where(Image.id == image_id).with_for_update()
    ).scalar_one()
    record = db.query(Analysis).filter_by(image_id=image_id).with_for_update().first()
    if record and is_stale(record):
        record.status = "failed"
    if record and record.status != "failed":
        db.commit()
        return record, False
    if record is None:
        record = Analysis(id=str(uuid4()), image_id=image_id)
        db.add(record)
    record.task_id = str(uuid4())
    record.status, record.created_at = "queued", now()
    record.started_at = record.completed_at = record.failure_reason = None
    db.commit()
    db.refresh(record)
    return record, True


def is_stale(record):
    started = record.started_at or record.created_at
    if started and started.tzinfo is None:
        started = started.replace(tzinfo=timezone.utc)
    return record.status not in TERMINAL and started < now() - timedelta(
        seconds=settings.ANALYSIS_TIMEOUT_SECONDS + 30
    )


def expire_stale(db, record):
    record = db.execute(
        select(Analysis)
        .where(Analysis.id == record.id)
        .with_for_update()
        .execution_options(populate_existing=True)
    ).scalar_one()
    if is_stale(record):
        record.status = "failed"
        record.failure_reason = "The worker did not finish within the processing window. Retry the analysis."
    db.commit()
    return record


def execute_analysis(db, analysis_id, task_id, predictor=None, narrator=None):
    record = db.execute(
        select(Analysis).where(Analysis.id == analysis_id).with_for_update()
    ).scalar_one()
    image = db.get(Image, record.image_id)
    if record.task_id != task_id or record.status != "queued":
        db.commit()
        return serialize(record, image)
    record.status, record.started_at = "running", now()
    db.commit()
    try:
        if predictor is None:
            from ml.ensemble.combine_models import ensemble_predict

            predictor = ensemble_predict
        result = predictor(image.file_path)
        narrative = (
            (narrator or generate_mitigation_report)(result)
            if result.get("status") != "inconclusive"
            else None
        )
        # A stale worker must never overwrite a later retry or timeout decision.
        db.expire_all()
        record = db.execute(
            select(Analysis).where(Analysis.id == analysis_id).with_for_update()
        ).scalar_one()
        if record.task_id != task_id or record.status != "running":
            db.commit()
            return serialize(record, image)
        record.status = result.get("status", "completed")
        record.model_votes = result.get("model_votes")
        record.model_agreement = result.get("model_agreement")
        record.model_version = result.get("model_version")
        record.description = result.get("description")
        if record.status == "completed":
            record.land_class, record.risk_level, record.risk_type = (
                result["land_class"],
                result["risk_level"],
                result["risk_type"],
            )
            record.score = SCORES[record.risk_level]
            record.narrative, record.narrative_source, record.narrative_reason = (
                narrative["text"],
                narrative["source"],
                narrative["reason"],
            )
        elif record.status != "inconclusive":
            raise ValueError("Invalid inference state")
        record.completed_at = now()
        db.commit()  # Success is never returned before durable persistence.
    except Exception as exc:
        db.rollback()
        record = db.execute(
            select(Analysis).where(Analysis.id == analysis_id).with_for_update()
        ).scalar_one()
        if record.task_id == task_id and record.status == "running":
            record.status, record.failure_reason = "failed", str(exc)[:500]
            db.commit()
        raise
    result = serialize(record, image)
    try:
        import socketio
        from fastapi.encoders import jsonable_encoder

        socketio.RedisManager(settings.REDIS_URL, write_only=True).emit(
            "analysis_complete", jsonable_encoder(result)
        )
    except Exception:
        log.warning("Result saved; socket delivery unavailable", exc_info=True)
    return result


def archived_reports(db):
    records = (
        db.query(Analysis, Image)
        .join(Image, Image.id == Analysis.image_id)
        .filter(Analysis.status.in_(["completed", "inconclusive"]))
        .all()
    )
    reports = [serialize(record, image) for record, image in records]
    # Historical rows are retained untouched; highest ID is the last stored record.
    from sqlalchemy import func

    latest = (
        db.query(RiskScore.image_id, func.max(RiskScore.id).label("latest_id"))
        .group_by(RiskScore.image_id)
        .subquery()
    )
    legacy = (
        db.query(RiskScore, Image)
        .join(latest, RiskScore.id == latest.c.latest_id)
        .join(Image, Image.id == RiskScore.image_id)
        .all()
    )
    covered = {r["image_id"] for r in reports}
    for risk, image in legacy:
        if image.id in covered:
            continue
        level = (
            risk.risk_level.lower()
            if risk.risk_level and risk.risk_level.lower() in {"low", "medium", "high"}
            else None
        )
        reports.append(
            {
                "id": f"legacy-{risk.id}",
                "image_id": image.id,
                "filename": image.filename,
                "uploaded_at": image.uploaded_at,
                "completed_at": None,
                "status": "completed",
                "score": risk.score,
                "land_class": risk.land_class,
                "risk_level": level,
                "risk_type": risk.risk_type,
                "description": None,
                "narrative": None,
                "narrative_source": None,
                "narrative_reason": None,
                "model_votes": None,
                "model_agreement": None,
                "model_version": None,
                "failure_reason": None,
                "location": None,
                "provenance": "legacy",
            }
        )
    return sorted(
        reports,
        key=lambda r: str(r.get("completed_at") or r["uploaded_at"]),
        reverse=True,
    )
