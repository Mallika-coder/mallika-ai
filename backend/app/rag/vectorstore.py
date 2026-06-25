from typing import List, Dict
from langchain_community.vectorstores import Chroma
from langchain.schema import Document

from app.rag.embeddings import get_embeddings
from app.config import settings


class VectorStoreManager:
    def __init__(self, collection_name: str = "default"):
        self.embeddings = get_embeddings()
        self.collection_name = collection_name
        self.vectorstore = Chroma(
            collection_name=collection_name,
            embedding_function=self.embeddings,
            persist_directory=f"{settings.chroma_persist_dir}/{collection_name}",
        )

    def add_documents(self, texts: List[str], metadatas: List[Dict] = None) -> int:
        documents = [
            Document(page_content=text, metadata=meta or {})
            for text, meta in zip(texts, metadatas or [{}] * len(texts))
        ]
        self.vectorstore.add_documents(documents)
        return len(documents)

    def search(self, query: str, top_k: int = 5, filter_dict: Dict = None) -> List[Dict]:
        kwargs = {"k": top_k}
        if filter_dict:
            kwargs["filter"] = filter_dict

        results = self.vectorstore.similarity_search_with_score(query, **kwargs)
        return [
            {
                "content": doc.page_content,
                "metadata": doc.metadata,
                "relevance_score": float(score),
            }
            for doc, score in results
        ]

    def delete(self, filter_dict: Dict):
        self.vectorstore.delete(filter=filter_dict)
