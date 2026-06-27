import json
from typing import List, Dict
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.models.message import Message
from app.models.memory import MemoryRecord
from app.core.prompt_templates import MEMORY_EXTRACTION_PROMPT


class MemoryManager:
    def __init__(self, db: AsyncSession, llm_provider, user_id: str):
        self.db = db
        self.llm = llm_provider
        self.user_id = user_id

    async def get_conversation(self, conversation_id: str, limit: int = 50) -> List[Dict]:
        result = await self.db.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.desc())
            .limit(limit)
        )
        messages = result.scalars().all()
        return [
            {"role": msg.role, "content": msg.content}
            for msg in reversed(messages)
        ]

    async def save_message(self, conversation_id: str, role: str, content: str):
        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            created_at=datetime.utcnow(),
        )
        self.db.add(message)
        await self.db.commit()

    async def get_user_memories(self) -> str:
        """Retrieve all stored memories for the current user."""
        result = await self.db.execute(
            select(MemoryRecord)
            .where(MemoryRecord.user_id == self.user_id)
            .order_by(MemoryRecord.created_at.desc())
        )
        memories = result.scalars().all()
        if not memories:
            return ""
        memory_lines = [f"- {m.content}" for m in memories]
        return "\n".join(memory_lines)

    async def check_remember_command(self, user_message: str) -> bool:
        """Check if the user explicitly asked to remember something."""
        lower = user_message.lower().strip()
        prefixes = ["remember that ", "remember: ", "please remember ", "remember "]
        for prefix in prefixes:
            if lower.startswith(prefix):
                fact = user_message[len(prefix):].strip()
                if fact:
                    await self._save_memory(fact, source="explicit")
                    return True
        return False

    async def extract_and_save_memories(self, user_message: str, assistant_response: str):
        """After each exchange, use the LLM to extract key facts about the user."""
        prompt = MEMORY_EXTRACTION_PROMPT.format(
            user_message=user_message,
            assistant_response=assistant_response,
        )
        messages = [
            {"role": "system", "content": "You extract user facts from conversations. Return only valid JSON."},
            {"role": "user", "content": prompt},
        ]

        try:
            full_response = ""
            async for chunk in self.llm.generate(messages, tools=None, stream=False):
                if chunk["type"] == "complete":
                    content = chunk["content"]
                    if hasattr(content, "content"):
                        # Anthropic response
                        if content.content and len(content.content) > 0:
                            full_response = content.content[0].text
                    elif hasattr(content, "message"):
                        full_response = content.message.content
                    else:
                        full_response = str(content)
                elif chunk["type"] == "text":
                    full_response += chunk["content"]

            # Parse JSON array from response
            full_response = full_response.strip()
            if full_response.startswith("```"):
                # Strip markdown code blocks
                lines = full_response.split("\n")
                full_response = "\n".join(lines[1:-1])

            facts = json.loads(full_response)
            if isinstance(facts, list):
                for fact in facts:
                    if isinstance(fact, str) and fact.strip():
                        await self._save_memory(fact.strip(), source="extracted")
        except (json.JSONDecodeError, Exception):
            # Silently skip if extraction fails
            pass

    async def _save_memory(self, content: str, source: str = "conversation"):
        """Save a single memory record."""
        # Check for duplicates
        result = await self.db.execute(
            select(MemoryRecord).where(
                MemoryRecord.user_id == self.user_id,
                MemoryRecord.content == content,
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            return

        memory = MemoryRecord(
            user_id=self.user_id,
            content=content,
            source=source,
            created_at=datetime.utcnow(),
        )
        self.db.add(memory)
        await self.db.commit()

    async def search_long_term(self, query: str, top_k: int = 5) -> str:
        """Return all user memories as context (simple approach without vector search)."""
        return await self.get_user_memories()
