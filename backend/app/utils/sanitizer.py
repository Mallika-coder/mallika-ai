import re
import html


def sanitize_html(text: str) -> str:
    return html.escape(text)


def sanitize_filename(filename: str) -> str:
    filename = re.sub(r'[^\w\s\-.]', '', filename)
    filename = re.sub(r'\s+', '_', filename)
    return filename[:255]


def sanitize_user_input(text: str, max_length: int = 50000) -> str:
    text = text[:max_length]
    text = text.replace('\x00', '')
    return text.strip()
