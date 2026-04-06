from fastapi import APIRouter, Query, HTTPException
from app.services.weather_service import get_weather
from app.models.schemas import WeatherResponse

router = APIRouter()

# Default coordinates — Sonipat, Haryana
DEFAULT_LAT = 28.9948
DEFAULT_LON = 77.0151


@router.get("/weather", response_model=WeatherResponse)
async def weather(
    lat: float = Query(default=DEFAULT_LAT, description="Latitude"),
    lon: float = Query(default=DEFAULT_LON, description="Longitude"),
):
    """
    Returns current weather + 3-day rain forecast using Open-Meteo (free, no key needed).
    Includes a farming-specific sowing advice message.

    Query params:
    - lat: latitude (default: Sonipat, Haryana)
    - lon: longitude
    """
    try:
        data = await get_weather(lat, lon)
        return WeatherResponse(**data)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Weather service error: {str(e)}")
