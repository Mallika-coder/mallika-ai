from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.models.database import get_db
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message
from app.dependencies import get_current_user

router = APIRouter()


class CreateConversationRequest(BaseModel):
    title: Optional[str] = "New Conversation"
    model: str = "gpt-4o"
    provider: str = "openai"
    space_id: Optional[str] = None


class UpdateConversationRequest(BaseModel):
    title: Optional[str] = None
    model: Optional[str] = None
    provider: Optional[str] = None


@router.get("/")
async def list_conversations(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == user.id)
        .order_by(Conversation.updated_at.desc())
    )
    conversations = result.scalars().all()
    return [
        {
            "id": c.id,
            "title": c.title,
            "model": c.model,
            "provider": c.provider,
            "space_id": c.space_id,
            "created_at": c.created_at.isoformat(),
            "updated_at": c.updated_at.isoformat(),
        }
        for c in conversations
    ]


@router.post("/")
async def create_conversation(
    request: CreateConversationRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conversation = Conversation(
        user_id=user.id,
        title=request.title,
        model=request.model,
        provider=request.provider,
        space_id=request.space_id,
    )
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)
    return {
        "id": conversation.id,
        "title": conversation.title,
        "model": conversation.model,
        "provider": conversation.provider,
    }


@router.get("/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user.id,
        )
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
    )
    messages = messages_result.scalars().all()

    return {
        "id": conversation.id,
        "title": conversation.title,
        "model": conversation.model,
        "provider": conversation.provider,
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "tool_calls": m.tool_calls,
                "files": m.files,
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
        ],
    }


@router.patch("/{conversation_id}")
async def update_conversation(
    conversation_id: str,
    request: UpdateConversationRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user.id,
        )
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if request.title is not None:
        conversation.title = request.title
    if request.model is not None:
        conversation.model = request.model
    if request.provider is not None:
        conversation.provider = request.provider

    await db.commit()
    return {"status": "updated"}


@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user.id,
        )
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    await db.delete(conversation)
    await db.commit()
    return {"status": "deleted"}
