import json
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict

from app.core.llm_provider import LLMProviderFactory
from app.core.agent_executor import AgentExecutor
from app.core.memory_manager import MemoryManager
from app.tools import get_all_tools
from app.models.database import async_session


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, conversation_id: str):
        await websocket.accept()
        self.active_connections[conversation_id] = websocket

    def disconnect(self, conversation_id: str):
        self.active_connections.pop(conversation_id, None)

    async def send_event(self, conversation_id: str, event: Dict):
        ws = self.active_connections.get(conversation_id)
        if ws:
            await ws.send_json(event)


manager = ConnectionManager()


async def websocket_endpoint(websocket: WebSocket, conversation_id: str):
    await manager.connect(websocket, conversation_id)

    try:
        while True:
            data = await websocket.receive_json()

            if data["type"] == "message":
                user_message = data["content"]
                files = data.get("files", [])
                model = data.get("model", "gpt-4o")
                provider = data.get("provider", "openai")
                user_id = data.get("user_id", "anonymous")

                async with async_session() as db:
                    llm = LLMProviderFactory.create(provider, model)
                    memory = MemoryManager(db, llm, user_id)
                    tools = get_all_tools()
                    agent = AgentExecutor(llm, tools, memory)

                    async for event in agent.execute(user_message, conversation_id, files or None):
                        await manager.send_event(conversation_id, event)

                    await manager.send_event(conversation_id, {"type": "done"})

            elif data["type"] == "stop":
                await manager.send_event(conversation_id, {"type": "stopped"})

    except WebSocketDisconnect:
        manager.disconnect(conversation_id)
    except Exception as e:
        await manager.send_event(conversation_id, {"type": "error", "message": str(e)})
        manager.disconnect(conversation_id)
