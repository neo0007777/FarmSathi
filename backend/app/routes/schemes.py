from fastapi import APIRouter, Query
from app.rag.pipeline import run_scheme_rag

router = APIRouter()


ALL_SCHEMES = [
    {
        "id": 1,
        "title": "PM-Kisan Samman Nidhi",
        "authority": "Ministry of Agriculture, GoI",
        "desc": "Direct income support of ₹6,000 annually. Distributed in 3 equal installments directly to bank accounts of eligible farmers.",
        "metric": "₹6K / yr",
        "type": "Subsidy",
        "segment": "Central",
        "deadline": "Rolling"
    },
    {
        "id": 2,
        "title": "PM Fasal Bima Yojana",
        "authority": "Agriculture Insurance Co.",
        "desc": "Comprehensive crop loss protection against non-preventable natural risks at highly subsidized premium rates (2% Kharif, 1.5% Rabi).",
        "metric": "Risk Cover",
        "type": "Insurance",
        "segment": "Central",
        "deadline": "July 31"
    },
    {
        "id": 3,
        "title": "Crop Diversification Strategy",
        "authority": "Haryana Dept of Agriculture",
        "desc": "Financial incentive designed to migrate cropping patterns from water-intensive paddy to sustainable alternatives like maize or pulses.",
        "metric": "₹7K / acre",
        "type": "Subsidy",
        "segment": "State",
        "deadline": "May 15"
    },
    {
        "id": 4,
        "title": "Micro Irrigation Fund",
        "authority": "NABARD & State Govt",
        "desc": "Capital subsidy for adopting drip and sprinkler irrigation technologies under the 'Per Drop More Crop' framework.",
        "metric": "55% Cap",
        "type": "Loan",
        "segment": "Central",
        "deadline": "Rolling"
    },
    {
        "id": 5,
        "title": "Kisan Credit Card (KCC)",
        "authority": "SBI / NABARD",
        "desc": "Short-term credit to farmers for crop cultivation at 4% interest rate with prompt repayment.",
        "metric": "₹3L Limit",
        "type": "Loan",
        "segment": "Central",
        "deadline": "Rolling"
    },
    {
        "id": 6,
        "title": "PM Kusum Yojana",
        "authority": "Ministry of New and Renewable Energy",
        "desc": "Installation of standalone solar agriculture pumps with a 90% subsidy structure for farmers off the grid.",
        "metric": "90% Subsidy",
        "type": "Subsidy",
        "segment": "Central",
        "deadline": "Rolling"
    },
    {
        "id": 7,
        "title": "Soil Health Card Scheme",
        "authority": "Ministry of Agriculture",
        "desc": "State-sponsored testing providing every farmer with a soil card every 2 years, containing specific crop nutrient recommendations.",
        "metric": "Free Tests",
        "type": "Subsidy",
        "segment": "State",
        "deadline": "Rolling"
    },
    {
        "id": 8,
        "title": "e-NAM (National Agriculture Market)",
        "authority": "Small Farmers Agribusiness Consortium",
        "desc": "Pan-India electronic trading portal that networks existing APMC mandis to create a unified national market for agricultural commodities.",
        "metric": "Online Trade",
        "type": "Subsidy",
        "segment": "Central",
        "deadline": "Rolling"
    },
    {
        "id": 9,
        "title": "Paramparagat Krishi Vikas Yojana (PKVY)",
        "authority": "Ministry of Agriculture",
        "desc": "Promotes organic farming through cluster approach and Participatory Guarantee System (PGS) certification with financial assistance.",
        "metric": "₹50K / ha",
        "type": "Subsidy",
        "segment": "Central",
        "deadline": "March 31"
    },
    {
        "id": 10,
        "title": "Rashtriya Krishi Vikas Yojana (RKVY)",
        "authority": "State Governments",
        "desc": "Umbrella scheme for ensuring holistic development of agriculture and allied sectors by allowing states to choose their own development activities.",
        "metric": "Infrastructure",
        "type": "Subsidy",
        "segment": "State",
        "deadline": "May 31"
    },
    {
        "id": 11,
        "title": "Mission for Integrated Development of Horticulture (MIDH)",
        "authority": "Ministry of Agriculture",
        "desc": "Centrally sponsored scheme for the holistic growth of the horticulture sector covering fruits, vegetables, root & tuber crops, and mushrooms.",
        "metric": "50% Grants",
        "type": "Subsidy",
        "segment": "Central",
        "deadline": "Rolling"
    },
    {
        "id": 12,
        "title": "National Mission for Sustainable Agriculture (NMSA)",
        "authority": "Ministry of Agriculture",
        "desc": "Promotes sustainable agriculture focusing on water use efficiency, nutrient management, and livelihood diversification.",
        "metric": "Climate Resilience",
        "type": "Subsidy",
        "segment": "Central",
        "deadline": "Rolling"
    },
    {
        "id": 13,
        "title": "National Food Security Mission (NFSM)",
        "authority": "Department of Agriculture",
        "desc": "Aims to increase the production of rice, wheat, pulses, coarse cereals, and commercial crops through area expansion and productivity enhancement.",
        "metric": "Yield Bonus",
        "type": "Subsidy",
        "segment": "Central",
        "deadline": "Rolling"
    },
    {
        "id": 14,
        "title": "Pradhan Mantri Annadata Aay SanraksHan Abhiyan (PM-AASHA)",
        "authority": "Ministry of Agriculture",
        "desc": "An umbrella scheme to ensure Minimum Support Price (MSP) to farmers, consisting of Price Support Scheme and Price Deficiency Payment Scheme.",
        "metric": "MSP Guarantee",
        "type": "Insurance",
        "segment": "Central",
        "deadline": "Rolling"
    },
    {
        "id": 15,
        "title": "Agri-Clinics and Agri-Business Centres (ACABC)",
        "authority": "MANAGE & NABARD",
        "desc": "Provides financial and training support to agriculture graduates to set up their own agribusinesses and clinics to advise farmers.",
        "metric": "₹20L Loan",
        "type": "Loan",
        "segment": "Central",
        "deadline": "Rolling"
    }
]

@router.get("/schemes/all")
async def get_all_schemes():
    return ALL_SCHEMES

@router.get("/schemes")
async def get_schemes(
    query: str = Query(default="farming subsidy schemes for small farmers"),
    state: str = Query(default="Haryana"),
):
    """
    Returns government scheme information retrieved from RAG.
    The RAG is pre-loaded with PM-Kisan, Fasal Bima, PMKSY,
    KCC, Kusum, and state-level scheme PDFs.

    Query params:
    - query: natural language search e.g. "irrigation subsidy"
    - state: filter context to state-specific schemes
    """
    full_query = f"{query} {state} farmers scheme"
    answer, sources = run_scheme_rag(full_query)

    return {
        "result": answer,
        "sources": sources,
        "query": query,
        "state": state,
    }
