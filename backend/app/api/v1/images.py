from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path
from ml.ensemble.combine_models import ensemble_predict
from app.schemas.image import RiskAssessmentResponse
from app.services.tasks import analyze_image_task
from celery.result import AsyncResult
from app.core.celery_app import celery_app
from PIL import Image as PILImage
from app.models.image import Image
from app.models.risk import RiskScore
from typing import List
from app.services.image_service import save_risk_score
import io

from app.db.session import get_db   
from app.schemas.image import ImageResponse
from app.services.image_service import (
    create_image,
    save_image_file,
    get_image_by_id,
    find_similar_images
)

router = APIRouter(prefix="/images")

ALLOWED_TYPES = {"image/jpeg", "image/png"}
MAX_FILE_SIZE = 5 * 1024 * 1024 


@router.post("/upload", response_model=ImageResponse)
def upload_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG and PNG allowed")

    contents = file.file.read()

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large")

    try:
        PILImage.open(io.BytesIO(contents)).verify()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image")

    try:
        file_path = save_image_file(contents, file.filename)
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to save image file"
        )

    image = create_image(
        db=db,
        filename=file.filename,
        file_path=file_path
    )

    return image


@router.get("/{image_id}", response_model=ImageResponse)
def get_image_metadata(
    image_id: int,
    db: Session = Depends(get_db)
):
    image = get_image_by_id(db, image_id)

    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    return image


@router.get("/{image_id}/file")
def get_image_file(
    image_id: int,
    db: Session = Depends(get_db)
):
    image = get_image_by_id(db, image_id)

    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    file_path = Path(image.file_path)

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image file missing on disk")

    return FileResponse(
        path=file_path,
        media_type="application/octet-stream",
        filename=image.filename
    )


@router.get("/{image_id}/similar")
def similar_images(
    image_id: int,
    limit: int = 5,
    db: Session = Depends(get_db)
):
    if limit <= 0:
        raise HTTPException(status_code=400, detail="Limit must be positive")

    image = get_image_by_id(db, image_id)

    if not image or image.embedding is None:
        raise HTTPException(status_code=404, detail="Image or embedding not found")

    results = find_similar_images(db, image.embedding, limit)

    return [
        {
            "id": r.id,
            "filename": r.filename,
            "similarity": float(r.similarity)
        }
        for r in results
    ]

@router.get("/{image_id}/analyze", response_model=RiskAssessmentResponse)
def analyze_image_risk(
    image_id: int,
    db: Session = Depends(get_db)
):
    image = get_image_by_id(db, image_id)
    
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
        
    file_path = Path(image.file_path)
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image file missing on disk")
        
    try:
        risk_info = ensemble_predict(str(file_path))
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"ML Pipeline failed: {str(e)}"
        )

    # Save the risk score to the database so KPI stats stay accurate
    try:
        save_risk_score(db, image_id, risk_info.get('risk_level', 'Low'))
    except Exception as score_error:
        # Non-fatal — log it but don't fail the whole request
        print(f'[Warning] Could not save risk score: {score_error}')

    return risk_info

@router.post("/{image_id}/analyze-async")
def trigger_async_analysis(
    image_id: int,
    db: Session = Depends(get_db)
):
    image = get_image_by_id(db, image_id)
    
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
        
    file_path = Path(image.file_path)
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image file missing on disk")
    
    # Pass image_id and filename so the task can include them
    # in the real-time socket.io event it emits on completion
    task = analyze_image_task.delay(
        str(file_path),
        image_id,
        image.filename
    )
    
    return {"task_id": task.id, "status": "Processing in background"}

@router.get("/tasks/{task_id}")
def get_task_status(task_id: str):
    task_result = AsyncResult(task_id, app=celery_app)
    
    if task_result.state == 'PENDING':
        return {"status": "Pending", "details": "Task is waiting in queue"}
    elif task_result.state == 'SUCCESS':
        return {"status": "Completed", "result": task_result.result}
    elif task_result.state == 'FAILURE':
        return {"status": "Failed", "details": str(task_result.info)}
    else:
        return {"status": task_result.state}

from sqlalchemy import func as sql_func

@router.get("/stats/summary")
def get_stats_summary(db: Session = Depends(get_db)):
    """
    Returns aggregate statistics for the dashboard KPI cards.
    This is a single endpoint that the frontend calls once on load
    rather than making four separate counting queries.
    """
    # Total number of images uploaded and analyzed
    total_images = db.query(sql_func.count(Image.id)).scalar() or 0
    
    # We derive risk counts from the risk_scores table.
    # A score above 65 is considered high risk, 35-65 medium, below 35 low.
    # This mirrors the thresholds used in our risk_mapper.py
    high_risk_count = db.query(
        sql_func.count(RiskScore.id)
    ).filter(RiskScore.score >= 65).scalar() or 0
    
    avg_score = db.query(
        sql_func.avg(RiskScore.score)
    ).scalar()
    
    total_reports = db.query(
        sql_func.count(RiskScore.id)
    ).scalar() or 0

    return {
        "total_analyzed":        total_images,
        "active_high_risk_zones": high_risk_count,
        "average_risk_score":    round(float(avg_score), 1) if avg_score else 0,
        "reports_generated":     total_reports,
    }

@router.get("/", response_model=List[ImageResponse])
def list_images(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Returns a paginated list of all uploaded images.
    Used by the Reports Archive page to show past analyses.
    """
    images = db.query(Image).order_by(
        Image.uploaded_at.desc()
    ).offset(skip).limit(limit).all()
    return images

@router.get("/stats/distribution")
def get_risk_distribution(db: Session = Depends(get_db)):
    """
    Returns the count of images in each risk level bucket.
    Low  = score < 35
    Medium = score 35-64
    High = score >= 65
    These thresholds match the frontend's color system:
    green (low), amber (medium), red (high).
    """
    low_count = db.query(
        sql_func.count(RiskScore.id)
    ).filter(RiskScore.score < 35).scalar() or 0

    medium_count = db.query(
        sql_func.count(RiskScore.id)
    ).filter(
        RiskScore.score >= 35,
        RiskScore.score < 65
    ).scalar() or 0

    high_count = db.query(
        sql_func.count(RiskScore.id)
    ).filter(RiskScore.score >= 65).scalar() or 0

    total = low_count + medium_count + high_count

    # If no data exists yet, return equal distribution as placeholder
    # so the chart never shows a blank/broken state
    if total == 0:
        return {
            "low":    0,
            "medium": 0,
            "high":   0,
            "total":  0,
        }

    return {
        "low":    low_count,
        "medium": medium_count,
        "high":   high_count,
        "total":  total,
    }

@router.get("/reports/full")
def get_full_reports(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Returns images joined with their actual risk analysis results.
    This is what the Reports Archive page uses to show real data
    instead of mock risk information.
    """
    results = db.query(
        Image.id,
        Image.filename,
        Image.uploaded_at,
        RiskScore.score,
        RiskScore.risk_level,
        RiskScore.risk_type,
        RiskScore.land_class,
    ).outerjoin(
        RiskScore,
        Image.id == RiskScore.image_id
    ).order_by(
        Image.uploaded_at.desc()
    ).offset(skip).limit(limit).all()

    return [
        {
            "id":          r.id,
            "filename":    r.filename,
            "uploaded_at": r.uploaded_at,
            "score":       r.score,
            "risk_level":  r.risk_level or 'Unknown',
            "risk_type":   r.risk_type  or 'Unknown',
            "land_class":  r.land_class or 'Unknown',
        }
        for r in results
    ]