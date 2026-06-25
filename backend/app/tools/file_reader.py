import os
from typing import Dict, Any

from app.tools.base_tool import BaseTool


class FileReaderTool(BaseTool):
    name = "file_reader"
    description = "Read and parse uploaded files. Supports PDF, DOCX, CSV, XLSX, TXT, images, and code files."
    parameters = {
        "type": "object",
        "properties": {
            "file_path": {"type": "string", "description": "Path to the file"},
            "file_type": {"type": "string", "description": "MIME type of the file"},
        },
        "required": ["file_path"],
    }

    async def execute(self, file_path: str, file_type: str = None) -> Dict[str, Any]:
        if not os.path.exists(file_path):
            return {"error": f"File not found: {file_path}"}

        ext = os.path.splitext(file_path)[1].lower()

        try:
            if ext == ".pdf":
                return await self._read_pdf(file_path)
            elif ext == ".docx":
                return await self._read_docx(file_path)
            elif ext in [".csv", ".xlsx", ".xls"]:
                return await self._read_spreadsheet(file_path, ext)
            elif ext in [".png", ".jpg", ".jpeg", ".gif", ".webp"]:
                return await self._read_image(file_path)
            elif ext in [".txt", ".md", ".py", ".js", ".ts", ".html", ".css", ".json", ".yaml", ".yml", ".toml", ".xml"]:
                return await self._read_text(file_path)
            else:
                return await self._read_text(file_path)
        except Exception as e:
            return {"error": f"Failed to read file: {str(e)}"}

    async def _read_pdf(self, file_path: str) -> Dict:
        import PyPDF2

        with open(file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            text = "\n".join(page.extract_text() or "" for page in reader.pages)
        return {"content": text, "pages": len(reader.pages), "type": "pdf"}

    async def _read_docx(self, file_path: str) -> Dict:
        from docx import Document

        doc = Document(file_path)
        text = "\n".join(p.text for p in doc.paragraphs if p.text)
        return {"content": text, "type": "docx"}

    async def _read_spreadsheet(self, file_path: str, ext: str) -> Dict:
        import pandas as pd

        if ext == ".csv":
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)
        return {
            "content": df.to_string(max_rows=100),
            "shape": list(df.shape),
            "columns": list(df.columns),
            "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
            "head": df.head(10).to_dict(),
            "type": "spreadsheet",
        }

    async def _read_image(self, file_path: str) -> Dict:
        from PIL import Image

        img = Image.open(file_path)
        try:
            import pytesseract
            text = pytesseract.image_to_string(img)
        except Exception:
            text = "[OCR not available]"
        return {"content": text, "size": list(img.size), "mode": img.mode, "type": "image"}

    async def _read_text(self, file_path: str) -> Dict:
        with open(file_path, "r", errors="replace") as f:
            content = f.read(100000)
        return {"content": content, "type": "text"}
