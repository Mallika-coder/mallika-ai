from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.database import get_db
from app.models.user import User
from app.models.memory import MemoryRecord
from app.dependencies import get_current_user

router = APIRouter()


class CreateMemoryRequest(BaseModel):
    content: str
    category: Optional[str] = None


@router.get("/")
async def list_memories(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MemoryRecord)
        .where(MemoryRecord.user_id == user.id)
        .order_by(MemoryRecord.created_at.desc())
    )
    memories = result.scalars().all()
    return [
        {
            "id": m.id,
            "content": m.content,
            "source": m.source,
            "category": m.category,
            "created_at": m.created_at.isoformat(),
        }
        for m in memories
    ]


@router.post("/")
async def create_memory(
    request: CreateMemoryRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    memory = MemoryRecord(
        user_id=user.id,
        content=request.content,
        source="manual",
        category=request.category,
    )
    db.add(memory)
    await db.commit()
    await db.refresh(memory)
    return {
        "id": memory.id,
        "content": memory.content,
        "source": memory.source,
        "category": memory.category,
        "created_at": memory.created_at.isoformat(),
    }


@router.delete("/{memory_id}")
async def delete_memory(
    memory_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MemoryRecord).where(
            MemoryRecord.id == memory_id,
            MemoryRecord.user_id == user.id,
        )
    )
    memory = result.scalar_one_or_none()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")

    await db.delete(memory)
    await db.commit()
    return {"status": "deleted"}


@router.delete("/")
async def clear_all_memories(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MemoryRecord).where(MemoryRecord.user_id == user.id)
    )
    memories = result.scalars().all()
    for m in memories:
        await db.delete(m)
    await db.commit()
    return {"status": "cleared", "count": len(memories)}
