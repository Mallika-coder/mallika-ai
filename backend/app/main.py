from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from app.config import settings
from app.api.routes import chat, conversations, files, spaces, auth, models, search
from app.api.routes import settings as settings_routes
from app.api.routes import shared, messages
from app.api.websocket import websocket_endpoint
from app.models.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="MallikaAI", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(conversations.router, prefix="/api/conversations", tags=["conversations"])
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(spaces.router, prefix="/api/spaces", tags=["spaces"])
app.include_router(models.router, prefix="/api/models", tags=["models"])
app.include_router(search.router, prefix="/api/search", tags=["search"])
app.include_router(settings_routes.router, prefix="/api/settings", tags=["settings"])
app.include_router(shared.router, prefix="/api/shared", tags=["shared"])
app.include_router(messages.router, prefix="/api/messages", tags=["messages"])


@app.websocket("/ws/chat/{conversation_id}")
async def websocket_chat(websocket: WebSocket, conversation_id: str):
    await websocket_endpoint(websocket, conversation_id)


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "app": settings.app_name}


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
