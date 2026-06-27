from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import get_db
from app.models.user import User
from app.dependencies import get_current_user

router = APIRouter()


class SettingsResponse(BaseModel):
    custom_instructions: Optional[str] = None


class UpdateSettingsRequest(BaseModel):
    custom_instructions: Optional[str] = None


@router.get("/", response_model=SettingsResponse)
async def get_settings(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get user's custom instructions and settings."""
    return SettingsResponse(custom_instructions=user.custom_instructions)


@router.put("/", response_model=SettingsResponse)
async def update_settings(
    request: UpdateSettingsRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Save user's custom instructions and settings."""
    if request.custom_instructions is not None:
        user.custom_instructions = request.custom_instructions

    await db.commit()
    await db.refresh(user)
    return SettingsResponse(custom_instructions=user.custom_instructions)
