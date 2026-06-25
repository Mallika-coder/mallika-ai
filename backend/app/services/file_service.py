import os
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.file import FileRecord
from app.tools.file_reader import FileReaderTool
from app.rag.retriever import RAGPipeline


class FileService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.reader = FileReaderTool()

    async def process_and_embed(self, file_id: str, space_id: Optional[str] = None):
        result = await self.db.execute(
            select(FileRecord).where(FileRecord.id == file_id)
        )
        file_record = result.scalar_one_or_none()
        if not file_record:
            return

        read_result = await self.reader.execute(file_path=file_record.storage_path)
        content = read_result.get("content", "")

        if content and space_id:
            pipeline = RAGPipeline(collection_name=f"space_{space_id}")
            chunks = await pipeline.ingest_document(
                content,
                {"file_id": file_id, "filename": file_record.original_filename},
            )
            file_record.is_embedded = True
            file_record.chunk_count = chunks
            await self.db.commit()
