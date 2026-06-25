import os
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.models.database import get_db
from app.models.user import User
from app.models.file import FileRecord
from app.dependencies import get_current_user

router = APIRouter()


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    conversation_id: str = None,
    space_id: str = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    filename = f"{file_id}{ext}"
    save_dir = os.path.join(settings.upload_dir, user.id)
    os.makedirs(save_dir, exist_ok=True)
    save_path = os.path.join(save_dir, filename)

    content = await file.read()
    if len(content) > settings.max_file_size_mb * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large")

    with open(save_path, "wb") as f:
        f.write(content)

    file_record = FileRecord(
        id=file_id,
        user_id=user.id,
        conversation_id=conversation_id,
        space_id=space_id,
        filename=filename,
        original_filename=file.filename,
        mime_type=file.content_type or "application/octet-stream",
        size_bytes=len(content),
        storage_path=save_path,
    )
    db.add(file_record)
    await db.commit()

    return {
        "id": file_record.id,
        "filename": file.filename,
        "mime_type": file_record.mime_type,
        "size": file_record.size_bytes,
        "path": save_path,
    }


@router.get("/")
async def list_files(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(FileRecord).where(FileRecord.user_id == user.id)
    )
    files = result.scalars().all()
    return [
        {
            "id": f.id,
            "filename": f.original_filename,
            "mime_type": f.mime_type,
            "size": f.size_bytes,
            "created_at": f.created_at.isoformat(),
        }
        for f in files
    ]


@router.get("/{file_id}/download")
async def download_file(
    file_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(FileRecord).where(FileRecord.id == file_id, FileRecord.user_id == user.id)
    )
    file_record = result.scalar_one_or_none()
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        file_record.storage_path,
        filename=file_record.original_filename,
        media_type=file_record.mime_type,
    )


@router.delete("/{file_id}")
async def delete_file(
    file_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(FileRecord).where(FileRecord.id == file_id, FileRecord.user_id == user.id)
    )
    file_record = result.scalar_one_or_none()
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")

    if os.path.exists(file_record.storage_path):
        os.remove(file_record.storage_path)

    await db.delete(file_record)
    await db.commit()
    return {"status": "deleted"}
