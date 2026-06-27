import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import PlainTextResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, or_

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


class FeedbackRequest(BaseModel):
    feedback: str  # "up" or "down"


@router.get("/search")
async def search_conversations(
    q: str = Query(..., min_length=1),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Full text search across all user's messages."""
    # Find messages matching the query in user's conversations
    result = await db.execute(
        select(Message)
        .join(Conversation, Message.conversation_id == Conversation.id)
        .where(
            Conversation.user_id == user.id,
            Message.content.ilike(f"%{q}%"),
        )
        .order_by(Message.created_at.desc())
        .limit(50)
    )
    messages = result.scalars().all()

    # Group by conversation
    conv_ids = set()
    results = []
    for msg in messages:
        if msg.conversation_id not in conv_ids:
            conv_ids.add(msg.conversation_id)
        results.append({
            "message_id": msg.id,
            "conversation_id": msg.conversation_id,
            "role": msg.role,
            "content": msg.content[:200],  # Truncate for preview
            "created_at": msg.created_at.isoformat(),
        })

    return {"results": results, "total": len(results)}


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
            "is_public": c.is_public,
            "share_slug": c.share_slug,
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
        "is_public": conversation.is_public,
        "share_slug": conversation.share_slug,
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "tool_calls": m.tool_calls,
                "files": m.files,
                "feedback": m.feedback,
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


@router.post("/{conversation_id}/share")
async def share_conversation(
    conversation_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Make a conversation public and generate a share slug."""
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user.id,
        )
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if not conversation.share_slug:
        conversation.share_slug = str(uuid.uuid4())[:8]
    conversation.is_public = True
    await db.commit()

    return {
        "status": "shared",
        "share_slug": conversation.share_slug,
        "is_public": True,
    }


@router.delete("/{conversation_id}/share")
async def unshare_conversation(
    conversation_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Make a conversation private again."""
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user.id,
        )
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    conversation.is_public = False
    await db.commit()

    return {"status": "unshared", "is_public": False}


@router.get("/{conversation_id}/export")
async def export_conversation(
    conversation_id: str,
    format: str = Query(default="md"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Export conversation as markdown or JSON."""
    if format not in ("md", "json"):
        raise HTTPException(status_code=400, detail="Format must be 'md' or 'json'")

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

    if format == "json":
        data = {
            "id": conversation.id,
            "title": conversation.title,
            "model": conversation.model,
            "provider": conversation.provider,
            "created_at": conversation.created_at.isoformat(),
            "messages": [
                {
                    "role": m.role,
                    "content": m.content,
                    "created_at": m.created_at.isoformat(),
                }
                for m in messages
                if m.role in ("user", "assistant")
            ],
        }
        return JSONResponse(
            content=data,
            headers={
                "Content-Disposition": f'attachment; filename="{conversation.title}.json"'
            },
        )

    # Markdown format
    lines = [f"# {conversation.title}\n"]
    lines.append(f"*Model: {conversation.model} | Provider: {conversation.provider}*\n")
    lines.append(f"*Created: {conversation.created_at.isoformat()}*\n")
    lines.append("---\n")

    for msg in messages:
        if msg.role == "user":
            lines.append(f"## User\n\n{msg.content}\n")
        elif msg.role == "assistant":
            lines.append(f"## Assistant\n\n{msg.content}\n")

    md_content = "\n".join(lines)
    return PlainTextResponse(
        content=md_content,
        media_type="text/markdown",
        headers={
            "Content-Disposition": f'attachment; filename="{conversation.title}.md"'
        },
    )
