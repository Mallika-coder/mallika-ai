from fastapi import APIRouter, Depends, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from typing import List, Optional
import json
import os
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.database import get_db
from app.models.user import User
from app.dependencies import get_current_user
from app.core.llm_provider import LLMProviderFactory
from app.core.agent_executor import AgentExecutor
from app.core.memory_manager import MemoryManager
from app.tools import get_all_tools

router = APIRouter()


@router.post("/send")
async def send_message(
    message: str = Form(...),
    conversation_id: str = Form(...),
    model: str = Form("llama-3.1-70b-versatile"),
    provider: str = Form("groq"),
    files: Optional[List[UploadFile]] = File(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uploaded_files = []
    if files:
        for file in files:
            file_id = str(uuid.uuid4())
            file_ext = os.path.splitext(file.filename)[1]
            save_path = os.path.join(settings.upload_dir, user.id, f"{file_id}{file_ext}")
            os.makedirs(os.path.dirname(save_path), exist_ok=True)

            content = await file.read()
            with open(save_path, "wb") as f:
                f.write(content)

            uploaded_files.append({
                "name": file.filename,
                "path": save_path,
                "mime_type": file.content_type,
            })

    llm = LLMProviderFactory.create(provider, model)
    memory = MemoryManager(db, llm, user.id)
    tools = get_all_tools()
    agent = AgentExecutor(llm, tools, memory)

    async def generate():
        async for event in agent.execute(message, conversation_id, uploaded_files or None):
            yield f"data: {json.dumps(event)}\n\n"
        yield 'data: {"type": "done"}\n\n'

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


@router.post("/quick")
async def quick_chat(
    message: str = Form(...),
    model: str = Form("llama-3.1-70b-versatile"),
    provider: str = Form("groq"),
):
    """Quick chat without auth - for extension quick queries."""
    llm = LLMProviderFactory.create(provider, model)

    messages = [
        {"role": "system", "content": "You are MallikaAI, a helpful AI assistant. Be concise and accurate."},
        {"role": "user", "content": message},
    ]

    async def generate():
        async for chunk in llm.generate(messages, stream=True):
            if chunk["type"] == "text":
                yield f"data: {json.dumps({'type': 'stream', 'content': chunk['content']})}\n\n"
        yield 'data: {"type": "done"}\n\n'

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )
