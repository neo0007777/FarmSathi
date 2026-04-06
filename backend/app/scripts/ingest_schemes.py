"""
Government Schemes Ingestion Script
====================================
Run this ONCE after ingest_icar.py to load scheme data into Pinecone.

Usage:
    cd backend
    python -m app.scripts.ingest_schemes

Also loads hardcoded scheme summaries so RAG works even without PDFs.

Free PDF sources:
    - https://pmkisan.gov.in          (PM-Kisan guidelines)
    - https://pmfby.gov.in            (Fasal Bima guidelines)
    - https://pmksy.gov.in            (PMKSY guidelines)
    - https://mnre.gov.in/kusum       (PM Kusum)
    - State agriculture dept websites (Haryana: agriharyana.gov.in)
"""

import os
import uuid

import fitz
from app.rag.embedder import embed_batch
from app.services.pinecone_client import upsert_vectors

SCHEME_DATA_DIR = "data/schemes"
CHUNK_SIZE = 350
CHUNK_OVERLAP = 70

# Hardcoded scheme summaries — these are always ingested even without PDFs
SCHEME_SUMMARIES = [
    {
        "source": "PM-Kisan Samman Nidhi",
        "text": """PM-Kisan Samman Nidhi Yojana provides direct income support of Rs 6000 per year to small and marginal farmers.
The amount is paid in three equal installments of Rs 2000 every four months directly into the farmer's bank account.
Eligibility: All landholding farmers' families with cultivable land up to 2 hectares.
Excluded categories: Institutional land holders, farmer families holding constitutional posts, serving or retired government employees with monthly pension above Rs 10000, income tax payers.
How to apply: Visit pmkisan.gov.in or nearest CSC center. Required documents: Aadhaar card, bank account, land records (Khasra/Khatauni).
Helpline: 155261 or 1800115526 (toll-free)."""
    },
    {
        "source": "PM Fasal Bima Yojana",
        "text": """Pradhan Mantri Fasal Bima Yojana (PMFBY) provides comprehensive insurance coverage to farmers against crop loss.
Premium rates: Kharif crops — 2% of sum insured. Rabi crops — 1.5% of sum insured. Annual commercial/horticultural crops — 5%.
Coverage: Pre-sowing risks, standing crop damage, post-harvest losses, localized calamities.
Sum insured: Based on scale of finance per hectare for each crop in each district.
How to apply: Through nearest bank branch, CSC, or insurance company office. Deadline: 15 July for Kharif, 15 December for Rabi.
Claim process: Report crop loss within 72 hours to insurance company, bank, or agriculture department."""
    },
    {
        "source": "PM Krishi Sinchayee Yojana",
        "text": """PM Krishi Sinchayee Yojana (PMKSY) promotes water use efficiency under 'More Crop Per Drop' initiative.
Subsidy on micro-irrigation: Small and marginal farmers get 55% subsidy on drip and sprinkler systems. Other farmers get 45%.
Components: Accelerated Irrigation Benefits Programme, Har Khet Ko Paani, Per Drop More Crop.
How to apply: Contact district agriculture office or state horticulture department. Online application at pmksy.gov.in.
Documents required: Land ownership proof, Aadhaar, bank account, soil health card.
States implementing: All states. Haryana farmers apply at agriharyana.gov.in."""
    },
    {
        "source": "Kisan Credit Card",
        "text": """Kisan Credit Card (KCC) provides short-term credit to farmers for crop cultivation and allied activities.
Credit limit: Up to Rs 3 lakh for crop loans. Above Rs 3 lakh at normal bank rates.
Interest rate: 4% per annum for loans up to Rs 3 lakh (with 2% interest subvention and 3% prompt repayment incentive).
Validity: 5 years subject to annual review.
Coverage: Crop cultivation expenses, post-harvest expenses, maintenance of farm assets, allied activities.
How to apply: Visit nearest bank (SBI, PNB, cooperative bank). Required: Land records, Aadhaar, passport photo.
Additional benefit: Personal accident insurance coverage of Rs 50000 included."""
    },
    {
        "source": "PM Kusum Yojana",
        "text": """PM Kusum Yojana (Pradhan Mantri Kisan Urja Suraksha evam Uttham Mahabhiyan) promotes solar energy in agriculture.
Component B: Installation of standalone solar agriculture pumps. Subsidy: 90% — Central 30%, State 30%, Farmer 10% (can avail bank loan for 30%).
Pump capacity: Up to 7.5 HP solar pump per farmer.
Additional income: Farmer can sell surplus power to DISCOM at fixed rate.
Eligibility: Any farmer with land. Priority to farmers without grid electricity.
How to apply: Through state nodas agency or DISCOM. Haryana: Apply through HAREDA (hareda.gov.in).
Helpline: 1800-180-3333"""
    },
    {
        "source": "Haryana Crop Diversification Scheme",
        "text": """Haryana Crop Diversification Scheme provides incentives to farmers who shift from paddy to alternative crops.
Incentive amount: Rs 7000 per acre for shifting from paddy to maize, bajra, pulses, oilseeds, or vegetables.
Mera Pani Meri Virasat: Additional Rs 8000 per acre in dark zone blocks where groundwater is critically depleted.
Eligible crops: Maize, bajra, moong, arhar, cotton, vegetables, sugarcane, fruit crops.
Eligibility: All farmers in Haryana cultivating paddy in Kharif season.
How to apply: Register on Meri Fasal Mera Byora portal (fasal.haryana.gov.in) before sowing.
Contact: District Agriculture Officer or Block Agriculture Office."""
    },
    {
        "source": "Soil Health Card Scheme",
        "text": """Soil Health Card Scheme provides every farmer a soil health card showing nutrient status of their soil.
The card gives crop-wise recommendations for nutrients and fertilizers.
Soil testing done free of cost at government labs every 2 years.
How to get: Apply at nearest agriculture department office or Krishi Vigyan Kendra.
Using the card: Follow recommended fertilizer doses to reduce input cost and improve yield.
Haryana: Register at agriharyana.gov.in or visit block agriculture office."""
    },
]


def chunk_text(text: str) -> list[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + CHUNK_SIZE
        chunk = text[start:end].strip()
        if len(chunk) > 50:
            chunks.append(chunk)
        start += CHUNK_SIZE - CHUNK_OVERLAP
    return chunks


def ingest_scheme_pdfs():
    """Ingest PDFs from data/schemes/ directory."""
    if not os.path.exists(SCHEME_DATA_DIR):
        print(f"[Ingest] {SCHEME_DATA_DIR} not found — only loading hardcoded summaries")
        return []

    pdf_files = [f for f in os.listdir(SCHEME_DATA_DIR) if f.lower().endswith(".pdf")]
    if not pdf_files:
        print("[Ingest] No scheme PDFs found — only loading hardcoded summaries")
        return []

    all_vectors = []
    for filename in pdf_files:
        path = os.path.join(SCHEME_DATA_DIR, filename)
        source = filename.replace(".pdf", "").replace("_", " ").title()
        print(f"  → {filename}")
        doc = fitz.open(path)
        text = "".join(page.get_text() for page in doc)
        doc.close()
        chunks = chunk_text(text)
        embeddings = embed_batch(chunks)
        for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
            all_vectors.append({
                "id": f"scheme_{source.replace(' ','_')}_{i}_{uuid.uuid4().hex[:6]}",
                "values": emb,
                "metadata": {"text": chunk, "source": source, "category": "scheme", "chunk_index": i},
            })
    return all_vectors


def ingest_hardcoded_summaries():
    """Always ingest the hardcoded scheme summaries."""
    print(f"\n[Ingest] Embedding {len(SCHEME_SUMMARIES)} hardcoded scheme summaries...")
    texts = [s["text"] for s in SCHEME_SUMMARIES]
    embeddings = embed_batch(texts)
    vectors = []
    for summary, emb in zip(SCHEME_SUMMARIES, embeddings):
        vectors.append({
            "id": f"scheme_{summary['source'].replace(' ','_')}_{uuid.uuid4().hex[:8]}",
            "values": emb,
            "metadata": {
                "text": summary["text"],
                "source": summary["source"],
                "category": "scheme",
            },
        })
    return vectors


def main():
    print("=" * 55)
    print("  FarmSathi — Government Schemes Ingestion")
    print("=" * 55)

    all_vectors = []
    all_vectors += ingest_hardcoded_summaries()
    all_vectors += ingest_scheme_pdfs()

    if all_vectors:
        print(f"\n[Ingest] Upserting {len(all_vectors)} scheme vectors to Pinecone...")
        upsert_vectors(all_vectors)
        print(f"[Ingest] ✅ Done! {len(all_vectors)} scheme vectors indexed.")
    else:
        print("[Ingest] Nothing to upsert.")


if __name__ == "__main__":
    main()
