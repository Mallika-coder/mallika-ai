from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    app_name: str = "MallikaAI"
    app_env: str = "development"
    debug: bool = True

    # Database
    database_url: str = "sqlite+aiosqlite:////tmp/mallika.db"
    database_url_sync: str = "sqlite:////tmp/mallika.db"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Auth
    jwt_secret: str = "change-this-secret"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    # LLM
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    groq_api_key: str = ""
    ollama_base_url: str = "http://localhost:11434"

    # Image Generation
    stability_api_key: str = ""

    # Search
    tavily_api_key: str = ""
    serpapi_key: str = ""

    # Storage
    upload_dir: str = "./data/uploads"
    max_file_size_mb: int = 50

    # Vector DB
    chroma_persist_dir: str = "./data/vectorstores"
    pinecone_api_key: str = ""
    pinecone_environment: str = ""

    # CORS
    cors_origins: str = "http://localhost:3000,chrome-extension://*"

    # Sandbox
    sandbox_image: str = "mallika-sandbox:latest"
    sandbox_timeout: int = 30
    sandbox_memory_limit: str = "512m"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
