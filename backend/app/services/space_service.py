from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.models.space import Space
from app.rag.retriever import SpaceManager


class SpaceService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.space_manager = SpaceManager()

    async def get_user_spaces(self, user_id: str) -> List[dict]:
        result = await self.db.execute(
            select(Space).where(Space.user_id == user_id)
        )
        return [
            {"id": s.id, "name": s.name, "description": s.description}
            for s in result.scalars().all()
        ]

    async def query_user_spaces(self, user_id: str, question: str):
        result = await self.db.execute(
            select(Space).where(Space.user_id == user_id)
        )
        spaces = result.scalars().all()
        space_ids = [s.id for s in spaces]

        if not space_ids:
            return []

        return await self.space_manager.query_all_spaces(space_ids, question)
