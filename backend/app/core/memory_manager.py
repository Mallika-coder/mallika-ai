import json
from typing import List, Dict
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.schema import Document

from app.config import settings
from app.models.message import Message


class MemoryManager:
    def __init__(self, db: AsyncSession, llm_provider, user_id: str):
        self.db = db
        self.llm = llm_provider
        self.user_id = user_id
        self.embeddings = OpenAIEmbeddings(
            model="text-embedding-3-small",
            openai_api_key=settings.openai_api_key,
        )
        self.memory_store = Chroma(
            collection_name=f"memory_{user_id}",
            embedding_function=self.embeddings,
            persist_directory=f"{settings.chroma_persist_dir}/memories/{user_id}",
        )

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

    async def extract_and_save_memories(self, user_message: str, assistant_response: str):
        extraction_prompt = f"""Analyze this conversation and extract any important facts about the user that should be remembered long-term. Return as JSON array of strings. Only include genuinely useful preferences, facts, or context. Return empty array if nothing notable.

User: {user_message}
Assistant: {assistant_response}

Return format: ["fact1", "fact2"] or []"""

        result = ""
        async for chunk in self.llm.generate(
            [
                {"role": "system", "content": "You extract user facts for long-term memory. Return only valid JSON."},
                {"role": "user", "content": extraction_prompt},
            ],
            stream=False,
        ):
            if chunk["type"] == "complete":
                content = chunk["content"]
                if hasattr(content, "content"):
                    result = content.content
                else:
                    result = str(content)
            elif chunk["type"] == "text":
                result += chunk["content"]

        try:
            facts = json.loads(result)
            for fact in facts:
                if fact and isinstance(fact, str):
                    doc = Document(
                        page_content=fact,
                        metadata={
                            "user_id": self.user_id,
                            "created_at": datetime.utcnow().isoformat(),
                            "source": "conversation",
                        },
                    )
                    self.memory_store.add_documents([doc])
        except (json.JSONDecodeError, TypeError):
            pass

    async def search_long_term(self, query: str, top_k: int = 5) -> str:
        try:
            results = self.memory_store.similarity_search(query, k=top_k)
            if not results:
                return ""
            return "\n".join(f"- {doc.page_content}" for doc in results)
        except Exception:
            return ""
