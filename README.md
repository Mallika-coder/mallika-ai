# MallikaAI

A full-featured AI assistant platform with deep reasoning, tool usage, file analysis, code execution, web search, RAG-based knowledge retrieval, and conversation memory.

## Features

- **Multi-Model Support** - Switch between GPT-4o, Claude, LLaMA 3, Mistral
- **Deep Reasoning** - Step-by-step thinking for complex problems
- **Tool Usage** - Web search, code execution, file analysis, document generation
- **RAG Knowledge Spaces** - Upload documents, query them with AI
- **Memory** - Remembers user preferences across conversations
- **Real-time Streaming** - WebSocket-based response streaming
- **File Analysis** - PDF, DOCX, CSV, XLSX, images, code files
- **Code Execution** - Sandboxed Python/JavaScript execution
- **Chrome Extension** - Side panel AI assistant for any webpage
- **Modern UI** - Dark mode, Tailwind CSS, responsive design

## Quick Start

```bash
# 1. Copy environment variables
cp .env.example .env
# Edit .env with your API keys (at minimum: OPENAI_API_KEY)

# 2. Start with Docker
docker-compose up -d

# 3. Access the app
# Web: http://localhost:3000
# API: http://localhost:8000/docs
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11, FastAPI, SQLAlchemy |
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| LLM | OpenAI, Anthropic, Ollama |
| Vector DB | ChromaDB |
| Database | PostgreSQL |
| Cache | Redis |
| Extension | Chrome Manifest V3, React |

## Documentation

- [Setup Guide](docs/SETUP.md)
- [API Reference](docs/API.md)
- [Architecture](docs/ARCHITECTURE.md)
