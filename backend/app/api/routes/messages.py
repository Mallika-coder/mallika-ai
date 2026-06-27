from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.database import get_db
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message
from app.dependencies import get_current_user

router = APIRouter()


class FeedbackRequest(BaseModel):
    feedback: str  # "up" or "down"


@router.post("/{message_id}/feedback")
async def save_message_feedback(
    message_id: str,
    request: FeedbackRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Save thumbs up/down feedback on a message."""
    if request.feedback not in ("up", "down"):
        raise HTTPException(status_code=400, detail="Feedback must be 'up' or 'down'")

    # Find the message and verify it belongs to the user
    result = await db.execute(
        select(Message)
        .join(Conversation, Message.conversation_id == Conversation.id)
        .where(
            Message.id == message_id,
            Conversation.user_id == user.id,
        )
    )
    message = result.scalar_one_or_none()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    message.feedback = request.feedback
    await db.commit()

    return {"status": "saved", "feedback": request.feedback}
