import json
from typing import List, Dict, Any, AsyncGenerator, Optional

from app.core.llm_provider import BaseLLMProvider
from app.tools.base_tool import BaseTool
from app.core.memory_manager import MemoryManager
from app.core.prompt_templates import SYSTEM_PROMPT

FOLLOW_UP_PROMPT = """Based on the conversation, suggest exactly 3 brief follow-up questions the user might want to ask next. Return them as a JSON array of strings. Each should be under 60 characters.

User asked: {user_message}
Assistant responded: {assistant_response}

Return format: ["question1", "question2", "question3"]"""


class AgentExecutor:
    def __init__(
        self,
        llm: BaseLLMProvider,
        tools: List[BaseTool],
        memory: MemoryManager,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        top_p: Optional[float] = None,
        custom_instructions: Optional[str] = None,
    ):
        self.llm = llm
        self.tools = {tool.name: tool for tool in tools}
        self.memory = memory
        self.max_iterations = 10
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.top_p = top_p
        self.custom_instructions = custom_instructions
        self.total_tokens_used = 0

    def get_tool_schemas(self) -> List[Dict]:
        return [tool.schema() for tool in self.tools.values()]

    async def execute(
        self, user_message: str, conversation_id: str, files: List = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        # Check for "remember" command
        await self.memory.check_remember_command(user_message)

        conversation_history = await self.memory.get_conversation(conversation_id)
        relevant_memories = await self.memory.search_long_term(user_message)

        system_message = SYSTEM_PROMPT
        if self.custom_instructions:
            system_message += f"\n\n## User's Custom Instructions\n{self.custom_instructions}"
        if relevant_memories:
            system_message += f"\n\n## Remembered Facts About This User\n{relevant_memories}"

        messages = [{"role": "system", "content": system_message}]
        messages.extend(conversation_history)

        if files:
            file_context = await self._process_files(files, user_message)
            if file_context:
                user_message = f"{user_message}\n\n[Attached Files Context]:\n{file_context}"

        messages.append({"role": "user", "content": user_message})

        await self.memory.save_message(conversation_id, "user", user_message)

        self.total_tokens_used = 0
        iteration = 0
        while iteration < self.max_iterations:
            iteration += 1

            full_response = ""
            tool_calls = []
            current_tool_call = None

            try:
                async for chunk in self.llm.generate(
                    messages,
                    tools=self.get_tool_schemas(),
                    stream=True,
                    temperature=self.temperature,
                    max_tokens=self.max_tokens,
                    top_p=self.top_p,
                ):
                    if chunk["type"] == "text":
                        full_response += chunk["content"]
                        yield {"type": "stream", "content": chunk["content"]}
                    elif chunk["type"] == "tool_call":
                        for tc in chunk["content"]:
                            if hasattr(tc, "id") and tc.id:
                                current_tool_call = {
                                    "id": tc.id,
                                    "type": "function",
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
                                if "type" not in tc:
                                    tc["type"] = "function"
                                tool_calls.append(tc)
                    elif chunk["type"] == "usage":
                        usage = chunk["content"]
                        self.total_tokens_used += usage.get("total_tokens", 0)
                        yield {"type": "token_usage", "usage": usage}
            except Exception as e:
                error_msg = str(e)
                if "failed_generation" in error_msg or "Failed to call a function" in error_msg:
                    if full_response:
                        yield {"type": "stream", "content": "\n\n*(Tool calling failed — responding without tools)*\n\n"}
                    # Retry without tools
                    try:
                        async for chunk in self.llm.generate(
                            messages, tools=None, stream=True,
                            temperature=self.temperature, max_tokens=self.max_tokens, top_p=self.top_p,
                        ):
                            if chunk["type"] == "text":
                                full_response += chunk["content"]
                                yield {"type": "stream", "content": chunk["content"]}
                    except Exception:
                        pass
                    tool_calls = []
                else:
                    yield {"type": "stream", "content": f"\n\nError: {error_msg}"}
                    break

            if not tool_calls:
                messages.append({"role": "assistant", "content": full_response})
                await self.memory.save_message(conversation_id, "assistant", full_response)
                await self.memory.extract_and_save_memories(user_message, full_response)

                # Generate follow-up suggestions
                follow_ups = await self._generate_follow_ups(user_message, full_response)
                if follow_ups:
                    yield {"type": "suggested_follow_ups", "suggestions": follow_ups}

                yield {
                    "type": "token_usage_total",
                    "total": {"total_tokens": self.total_tokens_used},
                }
                break

            # Ensure each tool_call has the required "type" field for Groq/OpenAI
            for tc in tool_calls:
                if "type" not in tc:
                    tc["type"] = "function"

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

    async def _generate_follow_ups(self, user_message: str, assistant_response: str) -> List[str]:
        """Generate 3 suggested follow-up questions."""
        try:
            # Truncate for efficiency
            truncated_response = assistant_response[:500] if len(assistant_response) > 500 else assistant_response
            prompt = FOLLOW_UP_PROMPT.format(
                user_message=user_message,
                assistant_response=truncated_response,
            )
            messages = [
                {"role": "system", "content": "Generate follow-up questions. Return only valid JSON array."},
                {"role": "user", "content": prompt},
            ]

            full_response = ""
            async for chunk in self.llm.generate(messages, tools=None, stream=False):
                if chunk["type"] == "complete":
                    content = chunk["content"]
                    if hasattr(content, "content"):
                        # Anthropic
                        if content.content and len(content.content) > 0:
                            full_response = content.content[0].text
                    elif hasattr(content, "message"):
                        full_response = content.message.content
                    else:
                        full_response = str(content)
                elif chunk["type"] == "text":
                    full_response += chunk["content"]

            full_response = full_response.strip()
            if full_response.startswith("```"):
                lines = full_response.split("\n")
                full_response = "\n".join(lines[1:-1])

            suggestions = json.loads(full_response)
            if isinstance(suggestions, list) and len(suggestions) >= 3:
                return suggestions[:3]
            return suggestions if isinstance(suggestions, list) else []
        except Exception:
            return []

    async def _process_files(self, files, user_message: str = "") -> str:
        contexts = []
        for file_info in files:
            file_path = file_info.get("path", "")
            mime_type = file_info.get("mime_type", "")

            # Check if it's an image and the model supports vision
            if mime_type and mime_type.startswith("image/") and self.llm.supports_vision():
                # For vision models, we don't need text extraction - handled via message format
                # But we still note it
                contexts.append(f"[Image attached: {file_info.get('name', 'image')}]")
                continue

            tool = self.tools.get("file_reader")
            if tool:
                try:
                    result = await tool.execute(
                        file_path=file_path,
                        file_type=mime_type,
                    )
                    contexts.append(f"File: {file_info['name']}\n{result.get('content', '')}")
                except Exception as e:
                    contexts.append(f"File: {file_info['name']}\n[Error reading file: {e}]")
        return "\n\n".join(contexts)
