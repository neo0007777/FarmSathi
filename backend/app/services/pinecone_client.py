import os
from pinecone import Pinecone, ServerlessSpec
from dotenv import load_dotenv

load_dotenv(override=True)

_pc = None
_index = None

DIMENSION = 384          # matches all-MiniLM-L6-v2 / paraphrase-multilingual-MiniLM-L12-v2
METRIC = "cosine"


def get_pinecone_index():
    global _pc, _index
    if _index is not None:
        return _index

    api_key = os.getenv("PINECONE_API_KEY")
    index_name = os.getenv("PINECONE_INDEX", "farmsathi-docs")

    if not api_key:
        raise ValueError("PINECONE_API_KEY not set in .env")

    _pc = Pinecone(api_key=api_key)

    # Create index if it doesn't exist yet
    existing = [i.name for i in _pc.list_indexes()]
    if index_name not in existing:
        _pc.create_index(
            name=index_name,
            dimension=DIMENSION,
            metric=METRIC,
            spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        )
        print(f"[Pinecone] Created index: {index_name}")
    else:
        print(f"[Pinecone] Using existing index: {index_name}")

    _index = _pc.Index(index_name)
    return _index


def upsert_vectors(vectors: list):
    """
    vectors = [
        {"id": "icar_001_chunk_0", "values": [...], "metadata": {"text": "...", "source": "...", "category": "..."}}
    ]
    """
    index = get_pinecone_index()
    # Pinecone recommends batches of 100
    batch_size = 100
    for i in range(0, len(vectors), batch_size):
        batch = vectors[i : i + batch_size]
        index.upsert(vectors=batch)
    print(f"[Pinecone] Upserted {len(vectors)} vectors")


def query_index(embedding: list, top_k: int = 5, filter_dict: dict = None) -> list:
    """
    Query Pinecone and return list of matching metadata dicts.
    filter_dict example: {"category": {"$in": ["disease", "pest"]}}
    """
    index = get_pinecone_index()
    kwargs = {"vector": embedding, "top_k": top_k, "include_metadata": True}
    if filter_dict:
        kwargs["filter"] = filter_dict

    result = index.query(**kwargs)
    return [
        {
            "text": match.metadata.get("text", ""),
            "source": match.metadata.get("source", "Unknown"),
            "score": round(match.score, 3),
            "category": match.metadata.get("category", ""),
        }
        for match in result.matches
        if match.score > 0.35      # ignore very low relevance matches
    ]
