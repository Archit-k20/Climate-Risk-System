from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
from app.api.v1.router import api_router
from app.core.config import settings

fastapi_app = FastAPI(title="ClimateRisk API", version="1.1.0")
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
fastapi_app.include_router(api_router)

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=settings.CORS_ORIGINS,
    client_manager=socketio.AsyncRedisManager(settings.REDIS_URL),
)
app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app, socketio_path="socket.io")
