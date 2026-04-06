from fastapi import APIRouter, Query
from app.services.mandi_service import get_mandi_prices

router = APIRouter()


@router.get("/mandi")
async def mandi(
    state: str = Query(default="Haryana"),
    commodity: str = Query(default=None),
    limit: int = Query(default=50, le=100),
):
    """
    Returns live mandi prices from data.gov.in Agmarknet API.
    Falls back to static data if API key is missing.

    Query params:
    - state: "Haryana", "Punjab", "UP", "MP" etc.
    - commodity: "Wheat", "Rice" etc. (optional — returns all if omitted)
    - limit: max records (default 20, max 50)
    """
    prices = await get_mandi_prices(state=state, commodity=commodity, limit=limit)
    return {"prices": prices, "state": state, "commodity": commodity, "count": len(prices)}
