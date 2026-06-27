from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.database import get_db
from app.models.conversation import Conversation
from app.models.message import Message

router = APIRouter()


@router.get("/{slug}")
async def get_shared_conversation(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a shared conversation by slug (no auth needed)."""
    result = await db.execute(
        select(Conversation).where(
            Conversation.share_slug == slug,
            Conversation.is_public == True,
        )
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Shared conversation not found")

    messages_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at)
    )
    messages = messages_result.scalars().all()

    return {
        "id": conversation.id,
        "title": conversation.title,
        "model": conversation.model,
        "provider": conversation.provider,
        "created_at": conversation.created_at.isoformat(),
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
            if m.role in ("user", "assistant")
        ],
    }
