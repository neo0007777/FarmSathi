"""
ICAR PDF Ingestion Script
=========================
Run this ONCE to load your ICAR crop advisory and disease management PDFs into Pinecone.

Usage:
    cd backend
    python -m app.scripts.ingest_icar

Place your downloaded PDFs in:
    data/icar/        ← crop advisories, pest management
    data/kvk/         ← KVK district bulletins

Free PDF sources:
    - https://www.icar.org.in/publications  (search "crop advisory")
    - https://kvk.icar.gov.in               (state KVK bulletins)
    - https://www.dac.gov.in/                (crop protection guidelines)
"""

import os
import uuid

import fitz  # PyMuPDF
from app.rag.embedder import embed_batch
from app.services.pinecone_client import upsert_vectors

# ── CONFIG ──────────────────────────────────────────────────────────────────
DATA_DIRS = {
    "data/icar": "crop_advisory",     # maps folder → Pinecone category tag
    "data/kvk":  "crop_advisory",
}

CHUNK_SIZE = 400        # characters per chunk
CHUNK_OVERLAP = 80      # overlap between chunks to preserve context
# ────────────────────────────────────────────────────────────────────────────


def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract all text from a PDF file using PyMuPDF."""
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split text into overlapping chunks."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end].strip()
        if len(chunk) > 50:      # skip tiny chunks
            chunks.append(chunk)
        start += chunk_size - overlap
    return chunks


def ingest_directory(dir_path: str, category: str):
    """Process all PDFs in a directory and upsert to Pinecone."""
    if not os.path.exists(dir_path):
        print(f"[Ingest] Directory not found: {dir_path} — skipping")
        return

    pdf_files = [f for f in os.listdir(dir_path) if f.lower().endswith(".pdf")]
    if not pdf_files:
        print(f"[Ingest] No PDFs found in {dir_path}")
        return

    print(f"\n[Ingest] Processing {len(pdf_files)} PDFs from {dir_path} (category: {category})")

    all_vectors = []
    for filename in pdf_files:
        pdf_path = os.path.join(dir_path, filename)
        source_name = filename.replace(".pdf", "").replace("_", " ").title()
        print(f"  → {filename}")

        text = extract_text_from_pdf(pdf_path)
        if not text.strip():
            print(f"     [!] Empty PDF, skipping")
            continue

        chunks = chunk_text(text)
        print(f"     {len(chunks)} chunks extracted")

        # Embed all chunks in batch (faster than one-by-one)
        embeddings = embed_batch(chunks)

        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            vector_id = f"{source_name.replace(' ','_')}_{i}_{uuid.uuid4().hex[:6]}"
            all_vectors.append({
                "id": vector_id,
                "values": embedding,
                "metadata": {
                    "text": chunk,
                    "source": source_name,
                    "category": category,
                    "chunk_index": i,
                },
            })

    if all_vectors:
        print(f"\n[Ingest] Upserting {len(all_vectors)} vectors to Pinecone...")
        upsert_vectors(all_vectors)
        print(f"[Ingest] ✅ Done! {len(all_vectors)} vectors indexed.")
    else:
        print("[Ingest] No vectors to upsert.")


def main():
    print("=" * 55)
    print("  FarmSathi — ICAR Knowledge Base Ingestion")
    print("=" * 55)
    for dir_path, category in DATA_DIRS.items():
        ingest_directory(dir_path, category)
    print("\n[Ingest] All ICAR data ingested. Your knowledge base is ready!")


if __name__ == "__main__":
    main()
