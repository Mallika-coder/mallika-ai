from app.tools.base_tool import BaseTool
from app.tools.web_search import WebSearchTool
from app.tools.code_executor import CodeExecutorTool
from app.tools.calculator import CalculatorTool


def get_all_tools():
    return [
        WebSearchTool(),
        CodeExecutorTool(),
        CalculatorTool(),
    ]
