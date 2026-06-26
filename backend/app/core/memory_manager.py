import json
from typing import List, Dict
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.models.message import Message


class MemoryManager:
    def __init__(self, db: AsyncSession, llm_provider, user_id: str):
        self.db = db
        self.llm = llm_provider
        self.user_id = user_id

    async def get_conversation(self, conversation_id: str, limit: int = 50) -> List[Dict]:
        result = await self.db.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.desc())
            .limit(limit)
        )
        messages = result.scalars().all()
        return [
            {"role": msg.role, "content": msg.content}
            for msg in reversed(messages)
        ]

    async def save_message(self, conversation_id: str, role: str, content: str):
        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            created_at=datetime.utcnow(),
        )
        self.db.add(message)
        await self.db.commit()

    async def extract_and_save_memories(self, user_message: str, assistant_response: str):
        pass

    async def search_long_term(self, query: str, top_k: int = 5) -> str:
        return ""
