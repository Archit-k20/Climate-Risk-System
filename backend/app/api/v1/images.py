import io
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from PIL import Image as PILImage, UnidentifiedImageError
from app.db.session import get_db
from app.models.image import Image
from app.models.analysis import Analysis
from app.schemas.image import (
    ImageResponse,
    AnalysisResponse,
    TaskResponse,
    AnalysisSubmission,
)
from app.services.image_service import (
    create_image,
    save_image_file,
    find_similar_images,
)
from app.services.analysis_service import (
    reserve,
    execute_analysis,
    serialize,
    archived_reports,
    expire_stale,
)

router = APIRouter(prefix="/images")
MAX_FILE_SIZE = 5 * 1024 * 1024


def require_image(db, image_id):
    image = db.get(Image, image_id)
    if not image:
        raise HTTPException(404, "Image not found")
    return image


@router.post("/upload", response_model=ImageResponse)
def upload_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    expected = {"image/jpeg": "JPEG", "image/png": "PNG"}.get(file.content_type)
    if not expected:
        raise HTTPException(415, "Only JPEG and PNG images are supported.")
    contents = file.file.read(MAX_FILE_SIZE + 1)
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(413, "Image must be 5 MiB or smaller.")
    try:
        with PILImage.open(io.BytesIO(contents)) as decoded:
            if decoded.format != expected:
                raise ValueError("Image type does not match file contents")
            decoded.verify()
    except (
        UnidentifiedImageError,
        OSError,
        ValueError,
        PILImage.DecompressionBombError,
    ):
        raise HTTPException(400, "Invalid or unsupported image contents.")
    filename = Path(file.filename or "image").name
    file_path = save_image_file(contents, ".jpg" if expected == "JPEG" else ".png")
    try:
        return create_image(db, filename, file_path)
    except Exception:
        db.rollback()
        Path(file_path).unlink(missing_ok=True)
        raise HTTPException(503, "Image could not be saved. Please retry.")


@router.get("/stats/summary")
def summary(db: Session = Depends(get_db)):
    q = db.query(Analysis).filter(Analysis.status == "completed")
    count, average = q.count(), q.with_entities(func.avg(Analysis.score)).scalar()
    return {
        "total_analyzed": count,
        "active_high_risk_zones": q.filter(Analysis.risk_level == "High").count(),
        "average_risk_score": round(average, 1) if average is not None else None,
        "reports_generated": q.filter(Analysis.narrative.isnot(None)).count(),
    }


@router.get("/stats/distribution")
def distribution(db: Session = Depends(get_db)):
    groups = (
        db.query(Analysis.risk_level, func.count(Analysis.id))
        .filter(Analysis.status == "completed")
        .group_by(Analysis.risk_level)
        .all()
    )
    counts = {"low": 0, "medium": 0, "high": 0}
    counts.update({level.lower(): count for level, count in groups if level})
    return {**counts, "total": sum(counts.values())}


@router.get("/reports/full", response_model=list[AnalysisResponse])
def reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return archived_reports(db)[skip : skip + limit]


@router.get("/tasks/{task_id}", response_model=TaskResponse)
def task_status(task_id: str, db: Session = Depends(get_db)):
    record = db.query(Analysis).filter_by(task_id=task_id).first()
    if not record:
        raise HTTPException(404, "Analysis task not found.")
    record = expire_stale(db, record)
    return {
        "status": record.status,
        "details": record.failure_reason,
        "result": serialize(record, db.get(Image, record.image_id)),
    }


@router.get("/", response_model=list[ImageResponse])
def images(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return (
        db.query(Image)
        .order_by(Image.uploaded_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{image_id}", response_model=ImageResponse)
def metadata(image_id: int, db: Session = Depends(get_db)):
    return require_image(db, image_id)


@router.get("/{image_id}/file")
def image_file(image_id: int, db: Session = Depends(get_db)):
    image = require_image(db, image_id)
    if not Path(image.file_path).is_file():
        raise HTTPException(404, "Image file is unavailable.")
    return FileResponse(image.file_path, filename=image.filename)


@router.get("/{image_id}/similar")
def similar(
    image_id: int, limit: int = Query(5, ge=1, le=100), db: Session = Depends(get_db)
):
    image = require_image(db, image_id)
    if image.embedding is None:
        raise HTTPException(404, "No embedding is available for this image.")
    return [
        {"id": r.id, "filename": r.filename, "similarity": float(r.similarity)}
        for r in find_similar_images(db, image.embedding, limit)
    ]


@router.post("/{image_id}/analyze-async", response_model=AnalysisSubmission)
def analyze_async(image_id: int, db: Session = Depends(get_db)):
    image = require_image(db, image_id)
    if not Path(image.file_path).is_file():
        raise HTTPException(404, "Image file is unavailable.")
    record, fresh = reserve(db, image_id)
    if fresh:
        try:
            from app.services.tasks import analyze_image_task

            analyze_image_task.apply_async(args=[record.id], task_id=record.task_id)
        except Exception:
            record.status, record.failure_reason = (
                "failed",
                "Processing queue is unavailable. Please retry.",
            )
            db.commit()
            raise HTTPException(503, record.failure_reason)
    return {"task_id": record.task_id, "status": record.status}


@router.get("/{image_id}/analyze", response_model=AnalysisResponse)
def analyze_sync(image_id: int, db: Session = Depends(get_db)):
    image = require_image(db, image_id)
    if not Path(image.file_path).is_file():
        raise HTTPException(404, "Image file is unavailable.")
    record, fresh = reserve(db, image_id)
    if not fresh:
        return serialize(record, image)
    try:
        return execute_analysis(db, record.id, record.task_id)
    except Exception:
        raise HTTPException(
            503,
            "Analysis could not complete. See task status for the recorded failure.",
        )
