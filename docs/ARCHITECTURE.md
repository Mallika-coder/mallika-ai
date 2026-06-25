# MallikaAI Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Clients                                  │
├────────────────┬─────────────────────────┬──────────────────────┤
│  Next.js Web   │   Chrome Extension      │    Mobile (Future)   │
│  (Port 3000)   │   (Side Panel)          │                      │
└───────┬────────┴────────────┬────────────┴──────────────────────┘
        │                     │
        │     HTTP/WebSocket  │
        ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend (Port 8000)                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────────┐  ┌─────────────┐               │
│  │   Auth   │  │   WebSocket  │  │   REST API  │               │
│  │  (JWT)   │  │  (Streaming) │  │   Routes    │               │
│  └──────────┘  └──────────────┘  └─────────────┘               │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Agent Executor                          │   │
│  │  ┌─────────┐  ┌──────────┐  ┌────────────┐              │   │
│  │  │   LLM   │  │  Memory  │  │   Tools    │              │   │
│  │  │Provider │  │ Manager  │  │  Registry  │              │   │
│  │  └─────────┘  └──────────┘  └────────────┘              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌─────────────┐  ┌──────────┐    │
│  │Web Search│  │  Code    │  │  File       │  │  Chart   │    │
│  │ (Tavily) │  │ Executor │  │  Reader     │  │Generator │    │
│  └──────────┘  └──────────┘  └─────────────┘  └──────────┘    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    RAG Pipeline                            │   │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────────┐            │   │
│  │  │ Chunker  │  │Embeddings│  │ VectorStore │            │   │
│  │  └──────────┘  └──────────┘  └─────────────┘            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐
│PostgreSQL│  │  Redis   │  │ ChromaDB │  │Docker Sandbox│
│(Messages │  │(Sessions │  │(Vectors  │  │(Code Exec)   │
│ Users)   │  │ Cache)   │  │ RAG)     │  │              │
└──────────┘  └──────────┘  └──────────┘  └──────────────┘
```

## Key Components

### Agent Executor
The core orchestration loop that:
1. Takes user message + conversation history
2. Calls LLM with available tools
3. If LLM requests tool use, executes tools and loops
4. Streams text responses in real-time
5. Saves to memory after completion

### LLM Provider Abstraction
Unified interface supporting:
- **OpenAI**: GPT-4o, GPT-4o-mini
- **Anthropic**: Claude Sonnet, Claude Haiku
- **Ollama**: LLaMA 3, Mistral, CodeLlama (local)

### Tool System
Pluggable tools with schema-based definition:
- `web_search` - Internet search via Tavily/DuckDuckGo
- `code_executor` - Sandboxed Python/JS execution
- `file_reader` - Multi-format file parsing
- `document_generator` - DOCX/PPTX/XLSX/PDF creation
- `data_analyzer` - Statistical analysis on datasets
- `chart_generator` - Visualization config generation
- `calculator` - Safe math evaluation

### RAG (Retrieval Augmented Generation)
- Documents chunked via RecursiveCharacterTextSplitter
- Embedded with OpenAI text-embedding-3-small
- Stored in ChromaDB (per-space collections)
- Retrieved via similarity search with reranking

### Memory System
- **Short-term**: Conversation history (PostgreSQL)
- **Long-term**: Extracted user facts (ChromaDB per-user)
- **Auto-extraction**: LLM extracts memorable facts after each exchange

## Data Flow

1. User sends message via WebSocket or SSE
2. Agent loads conversation history + relevant memories
3. System prompt + tools + context assembled
4. LLM generates response (streamed to client)
5. If tool calls detected: execute tools, feed results back, loop
6. Final response saved to DB
7. Memory extraction runs asynchronously
