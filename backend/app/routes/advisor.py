from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.rag.pipeline import run_rag_pipeline

router = APIRouter()


class AdvisorRequest(BaseModel):
    district: str = "Sonipat"
    state: str = "Haryana"
    soil_type: str = "Loamy"
    season: str = "Kharif"
    land_acres: float = 5.0
    water_source: str = "Canal + Tubewell"


@router.post("/advisor")
async def crop_advisor(req: AdvisorRequest):
    """
    Returns AI crop recommendations based on farm conditions.
    Retrieves relevant ICAR crop calendar and advisory docs via RAG.

    Request body:
    {
        "district": "Sonipat",
        "state": "Haryana",
        "soil_type": "Loamy",
        "season": "Kharif",
        "land_acres": 5,
        "water_source": "Canal + Tubewell"
    }
    """
    query = (
        f"Best crops to grow in {req.season} season in {req.district}, {req.state} "
        f"with {req.soil_type} soil and {req.water_source} water availability. "
        f"Farm size is {req.land_acres} acres. "
        f"Recommend varieties, expected yield per acre, and water requirements."
    )

    try:
        answer, sources = run_rag_pipeline(query, category="crop_advisory", top_k=5)
        return {
            "recommendations": answer,
            "sources": sources,
            "inputs": req.model_dump(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Advisor error: {str(e)}")
