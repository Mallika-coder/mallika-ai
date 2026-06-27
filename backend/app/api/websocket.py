import asyncio
import json
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict

from sqlalchemy import select

from app.core.llm_provider import LLMProviderFactory
from app.core.agent_executor import AgentExecutor
from app.core.memory_manager import MemoryManager
from app.core.prompt_templates import TITLE_GENERATION_PROMPT
from app.tools import get_all_tools
from app.models.database import async_session
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self._abort_events: Dict[str, asyncio.Event] = {}

    async def connect(self, websocket: WebSocket, conversation_id: str):
        await websocket.accept()
        self.active_connections[conversation_id] = websocket
        self._abort_events[conversation_id] = asyncio.Event()

    def disconnect(self, conversation_id: str):
        self.active_connections.pop(conversation_id, None)
        self._abort_events.pop(conversation_id, None)

    def get_abort_event(self, conversation_id: str) -> asyncio.Event:
        return self._abort_events.get(conversation_id)

    def request_abort(self, conversation_id: str):
        event = self._abort_events.get(conversation_id)
        if event:
            event.set()

    def reset_abort(self, conversation_id: str):
        event = self._abort_events.get(conversation_id)
        if event:
            event.clear()

    async def send_event(self, conversation_id: str, event: Dict):
        ws = self.active_connections.get(conversation_id)
        if ws:
            await ws.send_json(event)


manager = ConnectionManager()


async def _generate_title(llm, user_message: str) -> str:
    """Generate a conversation title from the first user message."""
    prompt = TITLE_GENERATION_PROMPT.format(message=user_message)
    messages = [
        {"role": "system", "content": "Generate a short title. Return only the title text."},
        {"role": "user", "content": prompt},
    ]
    title = ""
    try:
        async for chunk in llm.generate(messages, tools=None, stream=False):
            if chunk["type"] == "complete":
                content = chunk["content"]
                if hasattr(content, "content"):
                    # Anthropic response
                    if content.content and len(content.content) > 0:
                        title = content.content[0].text
                elif hasattr(content, "message"):
                    title = content.message.content
                else:
                    title = str(content)
            elif chunk["type"] == "text":
                title += chunk["content"]
    except Exception:
        title = user_message[:50]

    # Clean up title
    title = title.strip().strip('"').strip("'")
    if len(title) > 100:
        title = title[:100]
    return title or user_message[:50]


async def _is_first_message(db, conversation_id: str) -> bool:
    """Check if this is the first user message in a conversation."""
    result = await db.execute(
        select(Message)
        .where(
            Message.conversation_id == conversation_id,
            Message.role == "user",
        )
        .limit(1)
    )
    return result.scalar_one_or_none() is None


async def websocket_endpoint(websocket: WebSocket, conversation_id: str):
    await manager.connect(websocket, conversation_id)

    try:
        while True:
            data = await websocket.receive_json()

            if data["type"] == "message":
                user_message = data["content"]
                files = data.get("files", [])
                model = data.get("model", "llama-3.1-70b-versatile")
                provider = data.get("provider", "groq")
                user_id = data.get("user_id", "anonymous")

                # Model parameters from client
                temperature = data.get("temperature")
                max_tokens = data.get("max_tokens")
                top_p = data.get("top_p")

                # User-provided API keys (override server defaults)
                api_keys = data.get("api_keys", {})
                user_api_key = api_keys.get(provider) if api_keys else None

                # Reset abort state before starting a new generation
                manager.reset_abort(conversation_id)
                abort_event = manager.get_abort_event(conversation_id)

                async with async_session() as db:
                    llm = LLMProviderFactory.create(provider, model, api_key=user_api_key)
                    memory = MemoryManager(db, llm, user_id)
                    tools = get_all_tools()

                    # Get user's custom instructions
                    custom_instructions = None
                    if user_id != "anonymous":
                        user_result = await db.execute(
                            select(User).where(User.id == user_id)
                        )
                        user = user_result.scalar_one_or_none()
                        if user and user.custom_instructions:
                            custom_instructions = user.custom_instructions

                    agent = AgentExecutor(
                        llm,
                        tools,
                        memory,
                        temperature=temperature,
                        max_tokens=max_tokens,
                        top_p=top_p,
                        custom_instructions=custom_instructions,
                    )

                    # Check if we need to auto-generate a title
                    is_first = await _is_first_message(db, conversation_id)

                    aborted = False
                    async for event in agent.execute(user_message, conversation_id, files or None):
                        if abort_event and abort_event.is_set():
                            aborted = True
                            break
                        await manager.send_event(conversation_id, event)

                    if aborted:
                        await manager.send_event(conversation_id, {"type": "stopped"})
                        continue

                    # Auto-generate title after first message
                    if is_first:
                        title = await _generate_title(llm, user_message)
                        conv_result = await db.execute(
                            select(Conversation).where(Conversation.id == conversation_id)
                        )
                        conv = conv_result.scalar_one_or_none()
                        if conv:
                            conv.title = title
                            await db.commit()
                            await manager.send_event(
                                conversation_id,
                                {"type": "title_generated", "title": title},
                            )

                    await manager.send_event(conversation_id, {"type": "done"})

            elif data["type"] == "stop":
                manager.request_abort(conversation_id)
                await manager.send_event(conversation_id, {"type": "stopped"})

    except WebSocketDisconnect:
        manager.disconnect(conversation_id)
    except Exception as e:
        await manager.send_event(conversation_id, {"type": "error", "message": str(e)})
        manager.disconnect(conversation_id)
