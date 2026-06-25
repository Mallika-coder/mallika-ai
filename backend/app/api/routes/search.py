from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.models.user import User
from app.dependencies import get_current_user
from app.tools.web_search import WebSearchTool

router = APIRouter()


class SearchRequest(BaseModel):
    query: str
    num_results: int = 5


@router.post("/web")
async def web_search(
    request: SearchRequest,
    user: User = Depends(get_current_user),
):
    tool = WebSearchTool()
    results = await tool.execute(query=request.query, num_results=request.num_results)
    return results
