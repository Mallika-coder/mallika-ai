from fastapi import APIRouter

router = APIRouter()

AVAILABLE_MODELS = [
    {"id": "gpt-4o", "name": "GPT-4o", "provider": "openai", "description": "Most capable OpenAI model"},
    {"id": "gpt-4o-mini", "name": "GPT-4o Mini", "provider": "openai", "description": "Fast and affordable"},
    {"id": "claude-sonnet-4-20250514", "name": "Claude Sonnet", "provider": "anthropic", "description": "Balanced Anthropic model"},
    {"id": "claude-haiku-4-5-20251001", "name": "Claude Haiku", "provider": "anthropic", "description": "Fast Anthropic model"},
    {"id": "llama3:8b", "name": "LLaMA 3 8B", "provider": "ollama", "description": "Local open-source model"},
    {"id": "llama3:70b", "name": "LLaMA 3 70B", "provider": "ollama", "description": "Large local model"},
    {"id": "mistral:7b", "name": "Mistral 7B", "provider": "ollama", "description": "Fast local model"},
    {"id": "codellama:13b", "name": "Code Llama 13B", "provider": "ollama", "description": "Code-focused local model"},
]


@router.get("/")
async def list_models():
    return {"models": AVAILABLE_MODELS}


@router.get("/providers")
async def list_providers():
    return {
        "providers": [
            {"id": "openai", "name": "OpenAI", "models": [m for m in AVAILABLE_MODELS if m["provider"] == "openai"]},
            {"id": "anthropic", "name": "Anthropic", "models": [m for m in AVAILABLE_MODELS if m["provider"] == "anthropic"]},
            {"id": "ollama", "name": "Ollama (Local)", "models": [m for m in AVAILABLE_MODELS if m["provider"] == "ollama"]},
        ]
    }
