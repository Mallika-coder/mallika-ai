from abc import ABC, abstractmethod
from typing import AsyncGenerator, List, Dict, Any
import openai
import anthropic

from app.config import settings


class BaseLLMProvider(ABC):
    @abstractmethod
    async def generate(
        self, messages: List[Dict], tools: List[Dict] = None, stream: bool = True
    ) -> AsyncGenerator[Dict[str, Any], None]:
        pass

    @abstractmethod
    async def generate_embeddings(self, text: str) -> List[float]:
        pass


class OpenAIProvider(BaseLLMProvider):
    def __init__(self, model: str = "gpt-4o"):
        self.client = openai.AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = model

    async def generate(self, messages, tools=None, stream=True):
        kwargs = {"model": self.model, "messages": messages, "stream": stream}
        if tools:
            kwargs["tools"] = tools
            kwargs["tool_choice"] = "auto"

        response = await self.client.chat.completions.create(**kwargs)

        if stream:
            async for chunk in response:
                if chunk.choices[0].delta.content:
                    yield {"type": "text", "content": chunk.choices[0].delta.content}
                if chunk.choices[0].delta.tool_calls:
                    yield {"type": "tool_call", "content": chunk.choices[0].delta.tool_calls}
        else:
            yield {"type": "complete", "content": response.choices[0].message}

    async def generate_embeddings(self, text):
        response = await self.client.embeddings.create(
            model="text-embedding-3-small", input=text
        )
        return response.data[0].embedding


class AnthropicProvider(BaseLLMProvider):
    def __init__(self, model: str = "claude-sonnet-4-20250514"):
        self.client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        self.model = model

    async def generate(self, messages, tools=None, stream=True):
        system_msg = ""
        filtered_messages = []
        for msg in messages:
            if msg["role"] == "system":
                system_msg = msg["content"]
            else:
                filtered_messages.append(msg)

        kwargs = {
            "model": self.model,
            "max_tokens": 8192,
            "system": system_msg,
            "messages": filtered_messages,
        }
        if tools:
            anthropic_tools = []
            for tool in tools:
                func = tool["function"]
                anthropic_tools.append({
                    "name": func["name"],
                    "description": func["description"],
                    "input_schema": func["parameters"],
                })
            kwargs["tools"] = anthropic_tools

        if stream:
            async with self.client.messages.stream(**kwargs) as stream_response:
                async for event in stream_response:
                    if event.type == "content_block_delta":
                        if hasattr(event.delta, "text"):
                            yield {"type": "text", "content": event.delta.text}
                    elif event.type == "content_block_start":
                        if event.content_block.type == "tool_use":
                            yield {
                                "type": "tool_call",
                                "content": [{
                                    "id": event.content_block.id,
                                    "function": {
                                        "name": event.content_block.name,
                                        "arguments": "",
                                    },
                                }],
                            }
        else:
            response = await self.client.messages.create(**kwargs)
            yield {"type": "complete", "content": response}

    async def generate_embeddings(self, text):
        oai = openai.AsyncOpenAI(api_key=settings.openai_api_key)
        response = await oai.embeddings.create(
            model="text-embedding-3-small", input=text
        )
        return response.data[0].embedding


class GroqProvider(BaseLLMProvider):
    """Free cloud LLM via Groq (runs LLaMA 3, Mixtral at high speed)."""

    def __init__(self, model: str = "llama-3.1-70b-versatile"):
        self.client = openai.AsyncOpenAI(
            api_key=settings.groq_api_key,
            base_url="https://api.groq.com/openai/v1",
        )
        self.model = model

    async def generate(self, messages, tools=None, stream=True):
        kwargs = {"model": self.model, "messages": messages, "stream": stream}
        if tools:
            kwargs["tools"] = tools
            kwargs["tool_choice"] = "auto"

        response = await self.client.chat.completions.create(**kwargs)

        if stream:
            async for chunk in response:
                if chunk.choices[0].delta.content:
                    yield {"type": "text", "content": chunk.choices[0].delta.content}
                if chunk.choices[0].delta.tool_calls:
                    yield {"type": "tool_call", "content": chunk.choices[0].delta.tool_calls}
        else:
            yield {"type": "complete", "content": response.choices[0].message}

    async def generate_embeddings(self, text):
        oai = openai.AsyncOpenAI(api_key=settings.openai_api_key)
        response = await oai.embeddings.create(
            model="text-embedding-3-small", input=text
        )
        return response.data[0].embedding


class LLMProviderFactory:
    @staticmethod
    def create(provider: str, model: str = None) -> BaseLLMProvider:
        providers = {
            "openai": lambda m: OpenAIProvider(m or "gpt-4o"),
            "anthropic": lambda m: AnthropicProvider(m or "claude-sonnet-4-20250514"),
            "groq": lambda m: GroqProvider(m or "llama-3.1-70b-versatile"),
        }
        if provider not in providers:
            raise ValueError(f"Unknown provider: {provider}. Available: {list(providers.keys())}")
        return providers[provider](model)
