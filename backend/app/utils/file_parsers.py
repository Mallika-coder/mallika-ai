import os
from typing import Dict


def get_file_type(filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower()
    type_map = {
        ".pdf": "document",
        ".docx": "document",
        ".doc": "document",
        ".txt": "text",
        ".md": "text",
        ".csv": "spreadsheet",
        ".xlsx": "spreadsheet",
        ".xls": "spreadsheet",
        ".png": "image",
        ".jpg": "image",
        ".jpeg": "image",
        ".gif": "image",
        ".webp": "image",
        ".py": "code",
        ".js": "code",
        ".ts": "code",
        ".html": "code",
        ".css": "code",
        ".json": "data",
        ".yaml": "data",
        ".yml": "data",
    }
    return type_map.get(ext, "unknown")


def get_mime_type(filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower()
    mime_map = {
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".csv": "text/csv",
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".txt": "text/plain",
        ".json": "application/json",
    }
    return mime_map.get(ext, "application/octet-stream")
