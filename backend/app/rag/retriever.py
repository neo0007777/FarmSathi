from app.rag.embedder import embed_text
from app.services.pinecone_client import query_index
from typing import List, Optional


def retrieve(query: str, top_k: int = 5, category: Optional[str] = None) -> List[dict]:
    """
    Embed the query and retrieve top-k relevant chunks from Pinecone.

    Args:
        query:    The user's question (Hindi or English)
        top_k:    Number of chunks to retrieve
        category: Optional Pinecone metadata filter
                  e.g. "disease", "scheme", "pest", "crop_advisory"

    Returns:
        List of dicts: [{"text": "...", "source": "...", "score": 0.87, "category": "..."}]
    """
    embedding = embed_text(query)
    filter_dict = {"category": {"$eq": category}} if category else None
    results = query_index(embedding, top_k=top_k, filter_dict=filter_dict)
    return results


def format_context(chunks: List[dict]) -> str:
    """
    Format retrieved chunks into a readable context block for the LLM prompt.
    """
    if not chunks:
        return "No relevant documents found in knowledge base."

    lines = []
    for i, chunk in enumerate(chunks, 1):
        lines.append(f"[Source {i}: {chunk['source']} | Relevance: {chunk['score']}]")
        lines.append(chunk["text"].strip())
        lines.append("")
    return "\n".join(lines)
