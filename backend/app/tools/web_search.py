import os
from typing import Dict, Any

from app.tools.base_tool import BaseTool
from app.config import settings


class WebSearchTool(BaseTool):
    name = "web_search"
    description = "Search the internet for current information. Use for recent events, facts, or anything beyond training data."
    parameters = {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Search query"},
            "num_results": {
                "type": "integer",
                "description": "Number of results to return",
                "default": 5,
            },
        },
        "required": ["query"],
    }

    async def execute(self, query: str, num_results: int = 5) -> Dict[str, Any]:
        if settings.tavily_api_key:
            return await self._tavily_search(query, num_results)
        return await self._duckduckgo_search(query, num_results)

    async def _tavily_search(self, query: str, num_results: int) -> Dict:
        from tavily import TavilyClient

        client = TavilyClient(api_key=settings.tavily_api_key)
        results = client.search(query, max_results=num_results)
        formatted = []
        for r in results.get("results", []):
            formatted.append({
                "title": r["title"],
                "url": r["url"],
                "content": r["content"],
            })
        return {"results": formatted, "answer": results.get("answer", "")}

    async def _duckduckgo_search(self, query: str, num_results: int) -> Dict:
        from duckduckgo_search import DDGS

        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=num_results))
        formatted = []
        for r in results:
            formatted.append({
                "title": r.get("title", ""),
                "url": r.get("href", ""),
                "content": r.get("body", ""),
            })
        return {"results": formatted, "answer": ""}
