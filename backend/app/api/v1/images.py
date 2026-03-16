from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path
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
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


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
