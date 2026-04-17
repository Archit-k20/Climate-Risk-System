import sys
from pathlib import Path

# Add both the project root and backend directory to sys.path
# so that 'app' and 'ml' packages can be imported
root_path = Path(__file__).resolve().parent.parent.parent
backend_path = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_path))
sys.path.insert(0, str(root_path))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
from app.api.v1.router import api_router
from app.core.logging import setup_logging

setup_logging()

# ── Create the FastAPI app ────────────────────────────────────────────────────
fastapi_app = FastAPI(
    title="Climate Risk Intelligence API",
    version="1.0.0"
)

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

fastapi_app.include_router(api_router)

@fastapi_app.get("/")
def root():
    return {"status": "API is running"}

# ── Create the Socket.io server ───────────────────────────────────────────────
# async_mode='asgi' means socket.io runs as an ASGI app, which is the
# same protocol that FastAPI uses. This lets us mount them together.
# cors_allowed_origins allows the React frontend to connect via WebSocket.
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
    ]
)

# ── Socket.io event handlers ──────────────────────────────────────────────────

@sio.event
async def connect(sid, environ):
    print(f'[Socket.io] Client connected: {sid}')

@sio.event
async def disconnect(sid):
    print(f'[Socket.io] Client disconnected: {sid}')

# ── Mount socket.io alongside FastAPI ────────────────────────────────────────
# socketio.ASGIApp wraps both the socket.io server and the FastAPI app
# into a single ASGI application. Requests to /socket.io/ are handled
# by socket.io, all other requests go to FastAPI as normal.
# This is how one server handles both HTTP and WebSocket traffic.
app = socketio.ASGIApp(
    socketio_server=sio,
    other_asgi_app=fastapi_app,
    socketio_path='/socket.io'
)

# Export sio so other modules can emit events from anywhere in the backend.
# For example, the Celery task will import sio and call
# sio.emit('analysis_complete', data) when an analysis finishes.