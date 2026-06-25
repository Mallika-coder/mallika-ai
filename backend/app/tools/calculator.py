import math
from typing import Dict, Any

from app.tools.base_tool import BaseTool


class CalculatorTool(BaseTool):
    name = "calculator"
    description = "Perform mathematical calculations. Supports basic arithmetic, trigonometry, logarithms, and more."
    parameters = {
        "type": "object",
        "properties": {
            "expression": {
                "type": "string",
                "description": "Mathematical expression to evaluate (e.g., '2**10', 'math.sqrt(144)', 'math.pi * 5**2')",
            },
        },
        "required": ["expression"],
    }

    async def execute(self, expression: str) -> Dict[str, Any]:
        allowed_names = {
            "abs": abs,
            "round": round,
            "min": min,
            "max": max,
            "sum": sum,
            "pow": pow,
            "math": math,
        }

        try:
            result = eval(expression, {"__builtins__": {}}, allowed_names)
            return {"result": result, "expression": expression}
        except Exception as e:
            return {"error": f"Calculation error: {str(e)}"}
