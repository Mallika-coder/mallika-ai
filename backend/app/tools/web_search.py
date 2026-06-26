from typing import Dict, Any

from app.tools.base_tool import BaseTool


class WebSearchTool(BaseTool):
    name = "web_search"
    description = "Search the internet for current information."
    parameters = {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Search query"},
            "num_results": {"type": "integer", "description": "Number of results", "default": 5},
        },
        "required": ["query"],
    }

    async def execute(self, query: str, num_results: int = 5, **kwargs) -> Dict[str, Any]:
        try:
            from duckduckgo_search import DDGS
            with DDGS() as ddgs:
                results = list(ddgs.text(query, max_results=num_results))
            formatted = [
                {"title": r.get("title", ""), "url": r.get("href", ""), "content": r.get("body", "")}
                for r in results
            ]
            return {"results": formatted}
        except Exception as e:
            return {"results": [], "error": str(e)}
