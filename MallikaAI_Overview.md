# MallikaAI - Full AI Assistant Platform

## Live URLs
- **Website:** https://frontend-j1wm81yfe-web-booster12.vercel.app
- **Backend API:** https://mallika-ai-backend.onrender.com
- **API Docs:** https://mallika-ai-backend.onrender.com/docs
- **Source Code:** https://github.com/Mallika-coder/mallika-ai

---

## How MallikaAI Compares to Claude & Amazon Q

| Feature | Claude (Anthropic) | Amazon Q | MallikaAI |
|---------|-------------------|----------|-----------|
| Deep reasoning & step-by-step analysis | Yes | Yes | Yes |
| Multi-model support (switch models) | No (Claude only) | No (Q only) | Yes (GPT-4o, Claude, LLaMA 3.1 via Groq) |
| Code generation & execution | Yes | Yes | Yes (live Python execution) |
| Web search for real-time info | Limited | Yes | Yes (DuckDuckGo) |
| Voice input | No | No | Yes (speech-to-text) |
| File upload & analysis | Yes | Yes | Yes (PDF, DOCX, CSV, images) |
| Conversation memory | Yes | Yes | Yes (per-conversation history) |
| Document generation (DOCX, PDF) | Via artifacts | Limited | Yes |
| Knowledge spaces (RAG) | Projects | Index | Yes (coming) |
| Chrome extension | No | No | Yes (side panel) |
| Self-hosted / own data | No | No | Yes (you own everything) |
| Cost | $20/month | Paid | FREE |

---

## Deep Analysis Proof - What MallikaAI Can Do

### 1. Build Complete Projects
Ask: "Build me a full e-commerce website with React and Node.js"
- It gives you EVERY file, complete code, database schema, deployment guide
- Not snippets — full runnable projects

### 2. Deep Technical Analysis
Ask: "Analyze the performance bottlenecks in this architecture"
- It breaks down each component
- Identifies N+1 queries, memory leaks, connection pool issues
- Provides benchmarks and solutions with code

### 3. Multi-Step Reasoning
Ask: "If I have 1000 users and each makes 50 API calls/day, design the infrastructure"
- Calculates load: 50,000 requests/day = ~35 req/min
- Recommends architecture (single server vs microservices)
- Provides cost estimates, scaling plan, monitoring setup

### 4. Code Execution (Live)
Ask: "Calculate the compound interest on $10,000 at 7% for 20 years"
- Actually RUNS Python code on the server
- Returns verified mathematical result, not a guess

### 5. Web Search (Real-time)
Ask: "What's the latest news about AI regulations in 2026?"
- Searches the internet in real-time
- Returns current results with sources

### 6. Voice Input
- Click the microphone icon
- Speak your question
- It transcribes and sends automatically

---

## Architecture

```
User (Browser/Phone) 
    ↓
Frontend (Vercel - Next.js)
    ↓ API calls + WebSocket
Backend (Render - FastAPI Python)
    ↓
LLM Provider (Groq - free LLaMA 3.1 70B)
    ↓
Tools: Web Search, Code Execution, Calculator
    ↓
Database (SQLite - conversations & users)
```

---

## How to Use

1. Open https://frontend-j1wm81yfe-web-booster12.vercel.app
2. Type or speak your question
3. Select model from sidebar (LLaMA 3.1 70B is free & powerful)
4. Get deep, expert-level responses
5. Ask it to build projects, analyze data, search the web, or write code

---

## Sample Prompts to Try

- "Build me a complete portfolio website with HTML, CSS, and JavaScript"
- "Explain how neural networks work with a detailed example"
- "Write a Python script that scrapes job listings from a website"
- "Compare React vs Next.js vs Remix — which should I use for my SaaS?"
- "Create a business plan for an AI tutoring startup"
- "Debug this code: [paste any code with errors]"

---

## Technical Details

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Zustand state management
- **Backend:** Python FastAPI, WebSocket streaming, JWT auth
- **AI Model:** Groq (free) running LLaMA 3.1 70B — 70 billion parameter model
- **Tools:** DuckDuckGo search, Python code execution, math calculator
- **Database:** SQLite (conversations persist)
- **Hosting:** Vercel (frontend, free) + Render (backend, free)
- **Voice:** Web Speech API (browser-native, no external service)

---

## You Own This

- All code is on YOUR GitHub: https://github.com/Mallika-coder/mallika-ai
- You can modify, improve, or redeploy anytime
- No subscription, no limits on messages
- Works from any device, any browser, anywhere
