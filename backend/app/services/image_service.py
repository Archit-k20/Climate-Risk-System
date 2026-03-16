from sqlalchemy.orm import Session
from app.models.image import Image
from pathlib import Path
import uuid
from sqlalchemy import text

UPLOAD_DIR = Path("backend/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

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