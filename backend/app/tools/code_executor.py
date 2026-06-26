import subprocess
import tempfile
import os
from typing import Dict, Any

from app.tools.base_tool import BaseTool


class CodeExecutorTool(BaseTool):
    name = "code_executor"
    description = "Execute Python code. Use for calculations, data analysis, and generating outputs."
    parameters = {
        "type": "object",
        "properties": {
            "code": {"type": "string", "description": "Python code to execute"},
        },
        "required": ["code"],
    }

    async def execute(self, code: str, **kwargs) -> Dict[str, Any]:
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".py", delete=False, dir="/tmp"
        ) as f:
            f.write(code)
            f.flush()
            temp_path = f.name

        try:
            result = subprocess.run(
                ["python", temp_path],
                capture_output=True,
                text=True,
                timeout=10,
            )
            return {
                "stdout": result.stdout[:5000],
                "stderr": result.stderr[:2000],
                "exit_code": result.returncode,
            }
        except subprocess.TimeoutExpired:
            return {"error": "Execution timed out (10s limit)"}
        except Exception as e:
            return {"error": str(e)}
        finally:
            os.unlink(temp_path)
