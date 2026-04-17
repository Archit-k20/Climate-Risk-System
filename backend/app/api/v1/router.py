from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.images import router as images_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(health_router, tags=["Health"])
api_router.include_router(images_router, tags=["Images"])