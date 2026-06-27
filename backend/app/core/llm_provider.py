import base64
import os
from abc import ABC, abstractmethod
from typing import AsyncGenerator, List, Dict, Any, Optional
import openai
import anthropic

from app.config import settings


VISION_MODELS = {
    "llama-3.2-90b-vision-preview",
    "llama-3.2-11b-vision-preview",
    "gpt-4o",
    "gpt-4-vision-preview",
    "claude-sonnet-4-20250514",
    "claude-3-5-sonnet-20241022",
}


class BaseLLMProvider(ABC):
    model: str = ""

    @abstractmethod
    async def generate(
        self,
        messages: List[Dict],
        tools: List[Dict] = None,
        stream: bool = True,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        top_p: Optional[float] = None,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        pass

    @abstractmethod
    async def generate_embeddings(self, text: str) -> List[float]:
        pass

    def supports_vision(self) -> bool:
        """Return True if the current model supports image/vision inputs."""
        return self.model in VISION_MODELS

    @staticmethod
    def encode_image_to_base64(file_path: str) -> str:
        """Read an image file and return its base64 encoding."""
        with open(file_path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")

    @staticmethod
    def get_mime_type(file_path: str) -> str:
        """Determine MIME type from file extension."""
        ext = os.path.splitext(file_path)[1].lower()
        mime_map = {
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".gif": "image/gif",
            ".webp": "image/webp",
        }
        return mime_map.get(ext, "image/png")

    def build_vision_message(self, text: str, image_path: str) -> Dict:
        """Build a multimodal message with text and image for vision models."""
        b64_image = self.encode_image_to_base64(image_path)
        mime_type = self.get_mime_type(image_path)
        return {
            "role": "user",
            "content": [
                {"type": "text", "text": text},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:{mime_type};base64,{b64_image}",
                    },
                },
            ],
        }


class OpenAIProvider(BaseLLMProvider):
    def __init__(self, model: str = "gpt-4o", api_key: Optional[str] = None):
        self.client = openai.AsyncOpenAI(api_key=api_key or settings.openai_api_key)
        self.model = model

    async def generate(
        self,
        messages,
        tools=None,
        stream=True,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        top_p: Optional[float] = None,
    ):
        kwargs = {"model": self.model, "messages": messages, "stream": stream}
        if tools:
            kwargs["tools"] = tools
            kwargs["tool_choice"] = "auto"
        if temperature is not None:
            kwargs["temperature"] = temperature
        if max_tokens is not None:
            kwargs["max_tokens"] = max_tokens
        if top_p is not None:
            kwargs["top_p"] = top_p

        response = await self.client.chat.completions.create(**kwargs)

        if stream:
            async for chunk in response:
                if chunk.choices[0].delta.content:
                    yield {"type": "text", "content": chunk.choices[0].delta.content}
                if chunk.choices[0].delta.tool_calls:
                    yield {"type": "tool_call", "content": chunk.choices[0].delta.tool_calls}
                # Track usage from final chunk
                if hasattr(chunk, "usage") and chunk.usage:
                    yield {
                        "type": "usage",
                        "content": {
                            "prompt_tokens": chunk.usage.prompt_tokens,
                            "completion_tokens": chunk.usage.completion_tokens,
                            "total_tokens": chunk.usage.total_tokens,
                        },
                    }
        else:
            msg = response.choices[0].message
            usage_data = None
            if hasattr(response, "usage") and response.usage:
                usage_data = {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens,
                }
            yield {"type": "complete", "content": msg, "usage": usage_data}

    async def generate_embeddings(self, text):
        response = await self.client.embeddings.create(
            model="text-embedding-3-small", input=text
        )
        return response.data[0].embedding


class AnthropicProvider(BaseLLMProvider):
    def __init__(self, model: str = "claude-sonnet-4-20250514", api_key: Optional[str] = None):
        self.client = anthropic.AsyncAnthropic(api_key=api_key or settings.anthropic_api_key)
        self.model = model

    async def generate(
        self,
        messages,
        tools=None,
        stream=True,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        top_p: Optional[float] = None,
    ):
        system_msg = ""
        filtered_messages = []
        for msg in messages:
            if msg["role"] == "system":
                system_msg = msg["content"]
            else:
                filtered_messages.append(msg)

        kwargs = {
            "model": self.model,
            "max_tokens": max_tokens or 8192,
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
        if temperature is not None:
            kwargs["temperature"] = temperature
        if top_p is not None:
            kwargs["top_p"] = top_p

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
                    elif event.type == "message_delta":
                        if hasattr(event, "usage") and event.usage:
                            yield {
                                "type": "usage",
                                "content": {
                                    "prompt_tokens": getattr(event.usage, "input_tokens", 0),
                                    "completion_tokens": getattr(event.usage, "output_tokens", 0),
                                    "total_tokens": getattr(event.usage, "input_tokens", 0) + getattr(event.usage, "output_tokens", 0),
                                },
                            }
        else:
            response = await self.client.messages.create(**kwargs)
            usage_data = None
            if hasattr(response, "usage") and response.usage:
                usage_data = {
                    "prompt_tokens": response.usage.input_tokens,
                    "completion_tokens": response.usage.output_tokens,
                    "total_tokens": response.usage.input_tokens + response.usage.output_tokens,
                }
            yield {"type": "complete", "content": response, "usage": usage_data}

    async def generate_embeddings(self, text):
        oai = openai.AsyncOpenAI(api_key=settings.openai_api_key)
        response = await oai.embeddings.create(
            model="text-embedding-3-small", input=text
        )
        return response.data[0].embedding


class GroqProvider(BaseLLMProvider):
    """Free cloud LLM via Groq (runs LLaMA 3, Mixtral at high speed)."""

    def __init__(self, model: str = "llama-3.3-70b-versatile", api_key: Optional[str] = None):
        self.client = openai.AsyncOpenAI(
            api_key=api_key or settings.groq_api_key,
            base_url="https://api.groq.com/openai/v1",
        )
        self.model = model

    async def generate(
        self,
        messages,
        tools=None,
        stream=True,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        top_p: Optional[float] = None,
    ):
        # If vision is needed and current model doesn't support it, switch
        has_images = any(
            isinstance(msg.get("content"), list)
            for msg in messages
            if isinstance(msg, dict)
        )
        model = self.model
        if has_images and model not in VISION_MODELS:
            model = "llama-3.2-90b-vision-preview"

        kwargs = {"model": model, "messages": messages, "stream": stream}
        if tools:
            kwargs["tools"] = tools
            kwargs["tool_choice"] = "auto"
        if temperature is not None:
            kwargs["temperature"] = temperature
        if max_tokens is not None:
            kwargs["max_tokens"] = max_tokens
        if top_p is not None:
            kwargs["top_p"] = top_p

        response = await self.client.chat.completions.create(**kwargs)

        if stream:
            async for chunk in response:
                if chunk.choices[0].delta.content:
                    yield {"type": "text", "content": chunk.choices[0].delta.content}
                if chunk.choices[0].delta.tool_calls:
                    yield {"type": "tool_call", "content": chunk.choices[0].delta.tool_calls}
                if hasattr(chunk, "usage") and chunk.usage:
                    yield {
                        "type": "usage",
                        "content": {
                            "prompt_tokens": chunk.usage.prompt_tokens,
                            "completion_tokens": chunk.usage.completion_tokens,
                            "total_tokens": chunk.usage.total_tokens,
                        },
                    }
        else:
            msg = response.choices[0].message
            usage_data = None
            if hasattr(response, "usage") and response.usage:
                usage_data = {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens,
                }
            yield {"type": "complete", "content": msg, "usage": usage_data}

    async def generate_embeddings(self, text):
        oai = openai.AsyncOpenAI(api_key=settings.openai_api_key)
        response = await oai.embeddings.create(
            model="text-embedding-3-small", input=text
        )
        return response.data[0].embedding


class OllamaProvider(BaseLLMProvider):
    """Local LLM via Ollama (runs models like LLaMA, Mistral, etc. locally)."""

    def __init__(self, model: str = "llama3:8b", api_key: Optional[str] = None):
        self.client = openai.AsyncOpenAI(
            api_key="ollama",
            base_url=f"{settings.ollama_base_url}/v1",
        )
        self.model = model

    async def generate(
        self,
        messages,
        tools=None,
        stream=True,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        top_p: Optional[float] = None,
    ):
        kwargs = {"model": self.model, "messages": messages, "stream": stream}
        if tools:
            kwargs["tools"] = tools
            kwargs["tool_choice"] = "auto"
        if temperature is not None:
            kwargs["temperature"] = temperature
        if max_tokens is not None:
            kwargs["max_tokens"] = max_tokens
        if top_p is not None:
            kwargs["top_p"] = top_p

        response = await self.client.chat.completions.create(**kwargs)

        if stream:
            async for chunk in response:
                if chunk.choices[0].delta.content:
                    yield {"type": "text", "content": chunk.choices[0].delta.content}
                if chunk.choices[0].delta.tool_calls:
                    yield {"type": "tool_call", "content": chunk.choices[0].delta.tool_calls}
        else:
            msg = response.choices[0].message
            yield {"type": "complete", "content": msg, "usage": None}

    async def generate_embeddings(self, text):
        oai = openai.AsyncOpenAI(api_key=settings.openai_api_key)
        response = await oai.embeddings.create(
            model="text-embedding-3-small", input=text
        )
        return response.data[0].embedding


class LLMProviderFactory:
    @staticmethod
    def create(provider: str, model: str = None, api_key: Optional[str] = None) -> BaseLLMProvider:
        providers = {
            "openai": lambda m, k: OpenAIProvider(m or "gpt-4o", api_key=k),
            "anthropic": lambda m, k: AnthropicProvider(m or "claude-sonnet-4-20250514", api_key=k),
            "groq": lambda m, k: GroqProvider(m or "llama-3.3-70b-versatile", api_key=k),
            "ollama": lambda m, k: OllamaProvider(m or "llama3:8b", api_key=k),
        }
        if provider not in providers:
            raise ValueError(f"Unknown provider: {provider}. Available: {list(providers.keys())}")
        return providers[provider](model, api_key)
