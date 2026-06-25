from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.database import get_db
from app.models.user import User
from app.models.space import Space, SpaceFile
from app.dependencies import get_current_user
from app.rag.retriever import SpaceManager

router = APIRouter()
space_manager = SpaceManager()


class CreateSpaceRequest(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None


class QuerySpaceRequest(BaseModel):
    question: str
    top_k: int = 5


@router.get("/")
async def list_spaces(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Space).where(Space.user_id == user.id).order_by(Space.updated_at.desc())
    )
    spaces = result.scalars().all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "description": s.description,
            "icon": s.icon,
            "created_at": s.created_at.isoformat(),
        }
        for s in spaces
    ]


@router.post("/")
async def create_space(
    request: CreateSpaceRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    space = Space(
        user_id=user.id,
        name=request.name,
        description=request.description,
        icon=request.icon,
    )
    db.add(space)
    await db.commit()
    await db.refresh(space)
    return {"id": space.id, "name": space.name}


@router.post("/{space_id}/upload")
async def upload_to_space(
    space_id: str,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Space).where(Space.id == space_id, Space.user_id == user.id)
    )
    space = result.scalar_one_or_none()
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")

    content = await file.read()
    text_content = content.decode("utf-8", errors="replace")

    metadata = {"file_name": file.filename, "space_id": space_id}
    chunks_count = await space_manager.add_file_to_space(space_id, text_content, metadata)

    return {"status": "uploaded", "chunks": chunks_count, "filename": file.filename}


@router.post("/{space_id}/query")
async def query_space(
    space_id: str,
    request: QuerySpaceRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Space).where(Space.id == space_id, Space.user_id == user.id)
    )
    space = result.scalar_one_or_none()
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")

    results = await space_manager.query_space(space_id, request.question, request.top_k)
    return {"results": results}


@router.delete("/{space_id}")
async def delete_space(
    space_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Space).where(Space.id == space_id, Space.user_id == user.id)
    )
    space = result.scalar_one_or_none()
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")

    await db.delete(space)
    await db.commit()
    return {"status": "deleted"}
