from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext

from app.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create_oauth_user(
        self, email: str, name: str, provider: str, avatar_url: str = None
    ) -> User:
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        user = result.scalar_one_or_none()

        if user:
            return user

        user = User(
            email=email,
            name=name,
            provider=provider,
            avatar_url=avatar_url,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    def hash_password(self, password: str) -> str:
        return pwd_context.hash(password)
