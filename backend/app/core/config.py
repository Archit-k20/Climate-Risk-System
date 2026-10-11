import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


class Settings:
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "postgresql://climate_user:climate_pass@localhost:5433/climate_ai",
    )
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CORS_ORIGINS = [
        s.strip()
        for s in os.getenv(
            "CORS_ORIGINS", "http://localhost:3000,http://localhost:5173"
        ).split(",")
        if s.strip()
    ]
    UPLOAD_DIR = Path(
        os.getenv("UPLOAD_DIR", str(Path(__file__).resolve().parents[2] / "uploads"))
    )
    ANALYSIS_TIMEOUT_SECONDS = int(os.getenv("ANALYSIS_TIMEOUT_SECONDS", "600"))


settings = Settings()
