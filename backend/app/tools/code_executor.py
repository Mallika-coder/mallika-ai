import subprocess
import tempfile
import os
from typing import Dict, Any

from app.tools.base_tool import BaseTool
from app.config import settings


class CodeExecutorTool(BaseTool):
    name = "code_executor"
    description = "Execute Python or JavaScript code in a sandboxed environment. Use for calculations, data analysis, file processing, and generating outputs."
    parameters = {
        "type": "object",
        "properties": {
            "code": {"type": "string", "description": "Code to execute"},
            "language": {
                "type": "string",
                "enum": ["python", "javascript"],
                "default": "python",
                "description": "Programming language",
            },
        },
        "required": ["code"],
    }

    async def execute(self, code: str, language: str = "python") -> Dict[str, Any]:
        suffix = ".py" if language == "python" else ".js"
        cmd_prefix = "python" if language == "python" else "node"

        with tempfile.NamedTemporaryFile(
            mode="w", suffix=suffix, delete=False, dir="/tmp"
        ) as f:
            f.write(code)
            f.flush()
            temp_path = f.name

        try:
            result = subprocess.run(
                [
                    "docker", "run", "--rm",
                    "--network=none",
                    f"--memory={settings.sandbox_memory_limit}",
                    "--cpus=1",
                    "-v", f"{temp_path}:/code/script{suffix}:ro",
                    settings.sandbox_image,
                    cmd_prefix, f"/code/script{suffix}",
                ],
                capture_output=True,
                text=True,
                timeout=settings.sandbox_timeout,
            )
            return {
                "stdout": result.stdout[:10000],
                "stderr": result.stderr[:5000],
                "exit_code": result.returncode,
            }
        except subprocess.TimeoutExpired:
            return {"error": f"Execution timed out ({settings.sandbox_timeout}s limit)"}
        except FileNotFoundError:
            try:
                result = subprocess.run(
                    [cmd_prefix, temp_path],
                    capture_output=True,
                    text=True,
                    timeout=settings.sandbox_timeout,
                )
                return {
                    "stdout": result.stdout[:10000],
                    "stderr": result.stderr[:5000],
                    "exit_code": result.returncode,
                }
            except Exception as e:
                return {"error": f"Execution failed: {str(e)}"}
        finally:
            os.unlink(temp_path)
