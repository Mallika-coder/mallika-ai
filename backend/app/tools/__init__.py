from app.tools.base_tool import BaseTool
from app.tools.web_search import WebSearchTool
from app.tools.code_executor import CodeExecutorTool
from app.tools.calculator import CalculatorTool
from app.tools.image_generator import ImageGeneratorTool


def get_all_tools():
    tools = [
        WebSearchTool(),
        CodeExecutorTool(),
        CalculatorTool(),
        ImageGeneratorTool(),
    ]

    try:
        from app.tools.file_reader import FileReaderTool
        tools.append(FileReaderTool())
    except ImportError:
        pass

    try:
        from app.tools.chart_generator import ChartGeneratorTool
        tools.append(ChartGeneratorTool())
    except ImportError:
        pass

    try:
        from app.tools.data_analyzer import DataAnalyzerTool
        tools.append(DataAnalyzerTool())
    except ImportError:
        pass

    try:
        from app.tools.document_generator import DocumentGeneratorTool
        tools.append(DocumentGeneratorTool())
    except ImportError:
        pass

    try:
        from app.tools.image_analyzer import ImageAnalyzerTool
        tools.append(ImageAnalyzerTool())
    except ImportError:
        pass

    return tools
