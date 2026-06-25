from app.tools.base_tool import BaseTool
from app.tools.web_search import WebSearchTool
from app.tools.code_executor import CodeExecutorTool
from app.tools.file_reader import FileReaderTool
from app.tools.document_generator import DocumentGeneratorTool
from app.tools.data_analyzer import DataAnalyzerTool
from app.tools.calculator import CalculatorTool
from app.tools.chart_generator import ChartGeneratorTool


def get_all_tools():
    return [
        WebSearchTool(),
        CodeExecutorTool(),
        FileReaderTool(),
        DocumentGeneratorTool(),
        DataAnalyzerTool(),
        CalculatorTool(),
        ChartGeneratorTool(),
    ]
