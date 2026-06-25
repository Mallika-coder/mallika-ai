from typing import List
from langchain.text_splitter import RecursiveCharacterTextSplitter


class DocumentChunker:
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""],
        )

    def chunk_text(self, text: str) -> List[str]:
        return self.splitter.split_text(text)

    def chunk_with_metadata(self, text: str, base_metadata: dict) -> List[dict]:
        chunks = self.chunk_text(text)
        return [
            {"content": chunk, "metadata": {**base_metadata, "chunk_index": i}}
            for i, chunk in enumerate(chunks)
        ]
