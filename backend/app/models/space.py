import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.database import Base


class Space(Base):
    __tablename__ = "spaces"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="spaces")
    conversations = relationship("Conversation", back_populates="space")
    files = relationship("SpaceFile", back_populates="space", cascade="all, delete-orphan")


class SpaceFile(Base):
    __tablename__ = "space_files"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    space_id: Mapped[str] = mapped_column(String, ForeignKey("spaces.id"), index=True)
    file_id: Mapped[str] = mapped_column(String, ForeignKey("files.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    space = relationship("Space", back_populates="files")
