from sentence_transformers import SentenceTransformer
from typing import List

# paraphrase-multilingual supports Hindi + English — perfect for FarmSathi
MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"

_model = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        print(f"[Embedder] Loading model: {MODEL_NAME} ...")
        _model = SentenceTransformer(MODEL_NAME)
        print("[Embedder] Model loaded.")
    return _model


def embed_text(text: str) -> List[float]:
    """Embed a single string and return a list of floats."""
    model = get_model()
    vector = model.encode(text, convert_to_numpy=True)
    return vector.tolist()


def embed_batch(texts: List[str]) -> List[List[float]]:
    """Embed a list of strings. Faster than calling embed_text in a loop."""
    model = get_model()
    vectors = model.encode(texts, convert_to_numpy=True, batch_size=32, show_progress_bar=True)
    return [v.tolist() for v in vectors]
