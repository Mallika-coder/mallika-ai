# MallikaAI Setup Guide

## Prerequisites

- Python 3.11+
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)
- Redis 7 (or use Docker)

## Quick Start (Docker)

```bash
# Clone the repo
cd mallika-ai

# Copy environment variables
cp .env.example .env
# Edit .env with your API keys

# Start all services
docker-compose up -d

# Access:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

## Manual Setup

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp ../.env.example ../.env
# Edit .env with your keys

# Start PostgreSQL and Redis (via Docker or locally)
docker-compose up -d postgres redis

# Run migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local

# Start dev server
npm run dev
```

### Chrome Extension

```bash
cd extension

# Install dependencies
npm install

# Build
npm run build

# Load in Chrome:
# 1. Open chrome://extensions
# 2. Enable Developer Mode
# 3. Click "Load unpacked"
# 4. Select the extension/dist folder
```

### Sandbox (Code Execution)

```bash
cd backend/sandbox

# Build the sandbox image
docker build -f Dockerfile.sandbox -t mallika-sandbox:latest .
```

## API Keys Required

| Service | Required | Purpose |
|---------|----------|---------|
| OpenAI | Yes (or Ollama) | LLM + Embeddings |
| Anthropic | Optional | Claude models |
| Tavily | Optional | Web search (fallback: DuckDuckGo) |

## Architecture

```
[Browser/Extension] <-> [Next.js Frontend] <-> [FastAPI Backend]
                                                    |
                                            [PostgreSQL] [Redis]
                                            [ChromaDB] [Docker Sandbox]
```
