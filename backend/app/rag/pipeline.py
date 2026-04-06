from app.rag.retriever import retrieve, format_context
from app.services.groq_client import chat_completion
from typing import List, Tuple

SYSTEM_PROMPT = """You are FarmSathi AI, an expert agricultural advisor for Indian farmers.
You answer questions about crops, diseases, pests, fertilizers, irrigation, government schemes, and farming practices.

Rules you MUST follow:
1. Answer in the same language the user writes in. If they write in Hindi/Devanagari, reply in Hindi. If English, reply in English.
2. Always ground your answer in the CONTEXT provided below. If context is relevant, cite the source name.
3. Be practical and specific — give actionable advice with quantities, timings, and product names where possible.
4. If the context does not contain enough information, say so clearly and suggest the farmer consult their local KVK.
5. Keep answers concise but complete. Use numbered steps for treatment/action plans.
6. Never make up research data, chemical dosages, or scheme amounts that are not in the context.

CONTEXT FROM KNOWLEDGE BASE:
{context}
"""


def run_rag_pipeline(
    user_message: str,
    history: List[dict] = [],
    top_k: int = 5,
    category: str = None,
) -> Tuple[str, List[str]]:
    """
    Full RAG pipeline:
    1. Retrieve relevant chunks from Pinecone
    2. Build prompt with context
    3. Call Groq LLM
    4. Return (answer_text, list_of_sources)
    """

    # Step 1: Retrieve
    chunks = retrieve(user_message, top_k=top_k, category=category)
    context = format_context(chunks)
    sources = list({c["source"] for c in chunks})  # deduplicated

    # Step 2: Build messages
    system_msg = {"role": "system", "content": SYSTEM_PROMPT.format(context=context)}

    # Keep last 6 turns of history to stay within context window
    trimmed_history = history[-6:] if len(history) > 6 else history

    messages = [system_msg] + trimmed_history + [{"role": "user", "content": user_message}]

    # Step 3: Call Groq
    reply = chat_completion(messages, model="llama-3.3-70b-versatile", max_tokens=1024)

    return reply, sources


def run_scheme_rag(query: str) -> Tuple[str, List[str]]:
    """Specialised RAG for government scheme queries — filters to scheme category."""
    return run_rag_pipeline(query, category="scheme", top_k=4)


def run_disease_rag(disease_name: str) -> Tuple[str, List[str]]:
    """
    After vision model identifies a disease, retrieve treatment docs.
    Returns (treatment_text, sources).
    """
    query = f"treatment and management of {disease_name} in crops"
    return run_rag_pipeline(query, category="disease", top_k=5)
