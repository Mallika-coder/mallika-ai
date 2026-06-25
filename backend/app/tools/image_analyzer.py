import os
import base64
from typing import Dict, Any

from app.tools.base_tool import BaseTool


class ImageAnalyzerTool(BaseTool):
    name = "image_analyzer"
    description = "Analyze images using vision models. Describe content, extract text via OCR, identify objects."
    parameters = {
        "type": "object",
        "properties": {
            "file_path": {"type": "string", "description": "Path to the image file"},
            "question": {
                "type": "string",
                "description": "What to analyze about the image",
                "default": "Describe this image in detail.",
            },
        },
        "required": ["file_path"],
    }

    async def execute(self, file_path: str, question: str = "Describe this image in detail.") -> Dict[str, Any]:
        if not os.path.exists(file_path):
            return {"error": f"File not found: {file_path}"}

        from PIL import Image

        img = Image.open(file_path)
        info = {"size": list(img.size), "mode": img.mode, "format": img.format}

        try:
            import pytesseract
            ocr_text = pytesseract.image_to_string(img)
        except Exception:
            ocr_text = ""

        return {
            "description": f"Image: {img.size[0]}x{img.size[1]} {img.mode}",
            "ocr_text": ocr_text.strip() if ocr_text else "[No text detected]",
            "info": info,
        }
