from fastapi import APIRouter
from sqlalchemy import text
from app.db.session import engine
from app.core.config import settings

router = APIRouter()


@router.get("/health")
def health():
    services = {
        "api": "healthy",
        "database": "unknown",
        "redis": "unknown",
        "model": "unknown",
    }
    for name, check in [
        ("database", check_database),
        ("redis", check_redis),
        ("model", check_model),
    ]:
        try:
            check()
            services[name] = "healthy"
        except Exception:
            services[name] = "unavailable"
    return {
        "status": "ok"
        if all(v == "healthy" for v in services.values())
        else "degraded",
        "services": services,
    }


def check_database():
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))


def check_redis():
    import redis

    redis.Redis.from_url(
        settings.REDIS_URL, socket_connect_timeout=2, socket_timeout=2
    ).ping()


def check_model():
    from ml.ensemble.combine_models import load_models

    load_models()
