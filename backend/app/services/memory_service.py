from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.memory import MemoryRecord


class MemoryService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_memories(self, user_id: str):
        result = await self.db.execute(
            select(MemoryRecord).where(MemoryRecord.user_id == user_id)
        )
        return [
            {"id": m.id, "content": m.content, "created_at": m.created_at.isoformat()}
            for m in result.scalars().all()
        ]

    async def delete_memory(self, memory_id: str, user_id: str):
        result = await self.db.execute(
            select(MemoryRecord).where(
                MemoryRecord.id == memory_id,
                MemoryRecord.user_id == user_id,
            )
        )
        memory = result.scalar_one_or_none()
        if memory:
            await self.db.delete(memory)
            await self.db.commit()
