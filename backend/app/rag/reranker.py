from typing import List, Dict


class SimpleReranker:
    """Reranks results based on relevance score and content quality."""

    def rerank(self, results: List[Dict], query: str, top_k: int = 5) -> List[Dict]:
        for result in results:
            score = result.get("relevance_score", 0)
            content = result.get("content", "")

            query_words = set(query.lower().split())
            content_words = set(content.lower().split())
            overlap = len(query_words & content_words) / max(len(query_words), 1)

            result["rerank_score"] = score * 0.7 + overlap * 0.3

        results.sort(key=lambda x: x.get("rerank_score", 0), reverse=True)
        return results[:top_k]
