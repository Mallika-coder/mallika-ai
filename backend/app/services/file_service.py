import os
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.file import FileRecord


class FileService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_file(self, file_id: str) -> Optional[FileRecord]:
        result = await self.db.execute(
            select(FileRecord).where(FileRecord.id == file_id)
        )
        return result.scalar_one_or_none()
