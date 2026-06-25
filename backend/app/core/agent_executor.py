import json
from typing import List, Dict, Any, AsyncGenerator

from app.core.llm_provider import BaseLLMProvider
from app.tools.base_tool import BaseTool
from app.core.memory_manager import MemoryManager
from app.core.prompt_templates import SYSTEM_PROMPT


class AgentExecutor:
    def __init__(self, llm: BaseLLMProvider, tools: List[BaseTool], memory: MemoryManager):
        self.llm = llm
        self.tools = {tool.name: tool for tool in tools}
        self.memory = memory
        self.max_iterations = 10

    def get_tool_schemas(self) -> List[Dict]:
        return [tool.schema() for tool in self.tools.values()]

    async def execute(
        self, user_message: str, conversation_id: str, files: List = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        conversation_history = await self.memory.get_conversation(conversation_id)
        relevant_memories = await self.memory.search_long_term(user_message)

        system_message = SYSTEM_PROMPT
        if relevant_memories:
            system_message += f"\n\nRelevant memories about this user:\n{relevant_memories}"

        messages = [{"role": "system", "content": system_message}]
        messages.extend(conversation_history)

        if files:
            file_context = await self._process_files(files)
            user_message = f"{user_message}\n\n[Attached Files Context]:\n{file_context}"

        messages.append({"role": "user", "content": user_message})

        await self.memory.save_message(conversation_id, "user", user_message)

        iteration = 0
        while iteration < self.max_iterations:
            iteration += 1

            full_response = ""
            tool_calls = []
            current_tool_call = None

            async for chunk in self.llm.generate(
                messages, tools=self.get_tool_schemas(), stream=True
            ):
                if chunk["type"] == "text":
                    full_response += chunk["content"]
                    yield {"type": "stream", "content": chunk["content"]}
                elif chunk["type"] == "tool_call":
                    for tc in chunk["content"]:
                        if hasattr(tc, "id") and tc.id:
                            current_tool_call = {
                                "id": tc.id,
                                "function": {
                                    "name": tc.function.name if hasattr(tc, "function") else "",
                                    "arguments": "",
                                },
                            }
                            tool_calls.append(current_tool_call)
                        elif current_tool_call and hasattr(tc, "function"):
                            if tc.function.name:
                                current_tool_call["function"]["name"] = tc.function.name
                            if tc.function.arguments:
                                current_tool_call["function"]["arguments"] += tc.function.arguments
                        elif isinstance(tc, dict):
                            tool_calls.append(tc)

            if not tool_calls:
                messages.append({"role": "assistant", "content": full_response})
                await self.memory.save_message(conversation_id, "assistant", full_response)
                await self.memory.extract_and_save_memories(user_message, full_response)
                break

            messages.append({
                "role": "assistant",
                "content": full_response or None,
                "tool_calls": tool_calls,
            })

            for tool_call in tool_calls:
                tool_name = tool_call["function"]["name"]
                try:
                    tool_args = json.loads(tool_call["function"]["arguments"])
                except json.JSONDecodeError:
                    tool_args = {}

                yield {"type": "tool_start", "tool": tool_name, "args": tool_args}

                if tool_name in self.tools:
                    try:
                        result = await self.tools[tool_name].execute(**tool_args)
                        yield {"type": "tool_result", "tool": tool_name, "result": result}
                    except Exception as e:
                        result = {"error": str(e)}
                        yield {"type": "tool_error", "tool": tool_name, "error": str(e)}
                else:
                    result = {"error": f"Tool '{tool_name}' not found"}

                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.get("id", ""),
                    "content": json.dumps(result),
                })

    async def _process_files(self, files) -> str:
        contexts = []
        for file_info in files:
            tool = self.tools.get("file_reader")
            if tool:
                try:
                    result = await tool.execute(
                        file_path=file_info["path"],
                        file_type=file_info.get("mime_type"),
                    )
                    contexts.append(f"File: {file_info['name']}\n{result.get('content', '')}")
                except Exception as e:
                    contexts.append(f"File: {file_info['name']}\n[Error reading file: {e}]")
        return "\n\n".join(contexts)
