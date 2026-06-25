"""Standalone sandbox executor for code execution."""
import sys
import io
import traceback


def execute_code(code: str):
    old_stdout = sys.stdout
    old_stderr = sys.stderr
    sys.stdout = io.StringIO()
    sys.stderr = io.StringIO()

    try:
        exec(code, {"__builtins__": __builtins__})
        stdout = sys.stdout.getvalue()
        stderr = sys.stderr.getvalue()
        return {"stdout": stdout, "stderr": stderr, "exit_code": 0}
    except Exception:
        stderr = traceback.format_exc()
        return {"stdout": sys.stdout.getvalue(), "stderr": stderr, "exit_code": 1}
    finally:
        sys.stdout = old_stdout
        sys.stderr = old_stderr


if __name__ == "__main__":
    if len(sys.argv) > 1:
        with open(sys.argv[1], "r") as f:
            code = f.read()
        result = execute_code(code)
        print(result["stdout"], end="")
        if result["stderr"]:
            print(result["stderr"], file=sys.stderr, end="")
        sys.exit(result["exit_code"])
