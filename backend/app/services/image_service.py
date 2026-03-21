from sqlalchemy.orm import Session
from app.models.image import Image
from pathlib import Path
import uuid
from sqlalchemy import text
from app.models.risk import RiskScore

UPLOAD_DIR = Path("backend/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Add this mapping at the top of the file
RISK_LEVEL_TO_SCORE = {
    'Low':    22.0,
    'Medium': 55.0,
    'High':   82.0,
}

def save_image_file(contents: bytes, original_filename: str) -> str:
    extension = Path(original_filename).suffix
    unique_name = f"{uuid.uuid4()}{extension}"
    file_path = UPLOAD_DIR / unique_name

    with open(file_path, "wb") as f:
        f.write(contents)

    return str(file_path)

def create_image(db: Session, filename: str, file_path: str) -> Image:
    image = Image(
        filename=filename,
        file_path=file_path
    )
    db.add(image)
    db.commit()
    db.refresh(image)
    return image

def get_image_by_id(db: Session, image_id: int) -> Image | None:
    return db.query(Image).filter(Image.id == image_id).first()

def update_image_embedding(db: Session, image: Image, embedding) -> Image:
    image.embedding = embedding.tolist()
    db.commit()
    db.refresh(image)
    return image

def find_similar_images(db: Session, embedding, limit: int = 5):
    query = text("""
        SELECT id, filename, file_path,
               1 - (embedding <=> (:embedding)::vector) AS similarity
        FROM images
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> (:embedding)::vector
        LIMIT :limit
    """)
    return db.execute(
        query,
        {
            "embedding": embedding.tolist(),
            "limit": limit
        }
    ).fetchall()

def save_risk_score(db: Session, image_id: int, risk_level: str) -> RiskScore:
    """
    Saves a risk score record for a completed analysis.
    This populates the risk_scores table so the dashboard
    KPI stats endpoint returns accurate aggregate numbers.
    """
    score = RISK_LEVEL_TO_SCORE.get(risk_level, 50.0)
    risk_score = RiskScore(image_id=image_id, score=score)
    db.add(risk_score)
    db.commit()
    db.refresh(risk_score)
    return risk_score