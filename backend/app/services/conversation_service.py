from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.conversation import Conversation
from app.models.message import Message
from app.core.llm_provider import LLMProviderFactory
from app.core.prompt_templates import TITLE_GENERATION_PROMPT


class ConversationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def generate_title(self, conversation_id: str, first_message: str):
        llm = LLMProviderFactory.create("openai", "gpt-4o-mini")
        prompt = TITLE_GENERATION_PROMPT.format(message=first_message)

        title = ""
        async for chunk in llm.generate(
            [{"role": "user", "content": prompt}], stream=False
        ):
            if chunk["type"] == "complete":
                content = chunk["content"]
                title = content.content if hasattr(content, "content") else str(content)
            elif chunk["type"] == "text":
                title += chunk["content"]

        title = title.strip().strip('"')[:100]

        result = await self.db.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
        conversation = result.scalar_one_or_none()
        if conversation:
            conversation.title = title
            await self.db.commit()

        return title
