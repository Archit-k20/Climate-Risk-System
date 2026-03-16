from pydantic import BaseModel
from datetime import datetime

class ImageResponse(BaseModel):
    id: int
    filename: str
    file_path: str
    uploaded_at: datetime

    class Config:
        orm_mode = True
