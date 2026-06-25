from typing import List, Dict

from app.rag.vectorstore import VectorStoreManager
from app.rag.chunker import DocumentChunker


class RAGPipeline:
    def __init__(self, collection_name: str = "default"):
        self.vectorstore = VectorStoreManager(collection_name)
        self.chunker = DocumentChunker()

    async def ingest_document(self, content: str, metadata: Dict) -> int:
        chunks = self.chunker.chunk_text(content)
        metadatas = [{**metadata, "chunk_index": i} for i in range(len(chunks))]
        return self.vectorstore.add_documents(chunks, metadatas)

    async def query(self, question: str, top_k: int = 5, filter_metadata: Dict = None) -> List[Dict]:
        return self.vectorstore.search(question, top_k, filter_metadata)

    async def delete_document(self, file_id: str):
        self.vectorstore.delete({"file_id": file_id})


class SpaceManager:
    def __init__(self):
        self.pipelines: Dict[str, RAGPipeline] = {}

    def get_or_create_space(self, space_id: str) -> RAGPipeline:
        if space_id not in self.pipelines:
            self.pipelines[space_id] = RAGPipeline(collection_name=f"space_{space_id}")
        return self.pipelines[space_id]

    async def add_file_to_space(self, space_id: str, file_content: str, file_metadata: Dict) -> int:
        pipeline = self.get_or_create_space(space_id)
        return await pipeline.ingest_document(file_content, file_metadata)

    async def query_space(self, space_id: str, question: str, top_k: int = 5) -> List[Dict]:
        pipeline = self.get_or_create_space(space_id)
        return await pipeline.query(question, top_k)

    async def query_all_spaces(self, space_ids: List[str], question: str, top_k: int = 3) -> List[Dict]:
        all_results = []
        for space_id in space_ids:
            results = await self.query_space(space_id, question, top_k)
            all_results.extend(results)
        all_results.sort(key=lambda x: x["relevance_score"])
        return all_results[: top_k * 2]
