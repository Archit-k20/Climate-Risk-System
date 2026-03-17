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
        
    # Dispatch the task to Celery
    task = analyze_image_task.delay(str(file_path))
    
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