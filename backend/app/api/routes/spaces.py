from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.database import get_db
from app.models.user import User
from app.models.space import Space
from app.dependencies import get_current_user

router = APIRouter()


class CreateSpaceRequest(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None


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
