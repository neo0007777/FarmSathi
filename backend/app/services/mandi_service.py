import os
import httpx
from dotenv import load_dotenv

load_dotenv()

# data.gov.in Agmarknet mandi prices dataset
MANDI_API_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"


async def get_mandi_prices(state: str = "Haryana", commodity: str = None, limit: int = 20) -> list:
    """
    Fetch live mandi prices from data.gov.in Agmarknet API.
    Returns list of mandi price records.

    Args:
        state:     State name e.g. "Haryana", "Punjab"
        commodity: Crop name e.g. "Wheat", "Rice" (optional)
        limit:     Max records to return
    """
    api_key = os.getenv("DATA_GOV_API_KEY")
    if not api_key:
        return _fallback_mandi_data()

    params = {
        "api-key": api_key,
        "format": "json",
        "limit": limit,
        "filters[state]": state,
    }
    if commodity:
        params["filters[commodity]"] = commodity

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(MANDI_API_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

        records = data.get("records", [])
        return [
            {
                "crop": r.get("commodity", ""),
                "mandi": r.get("market", ""),
                "state": r.get("state", ""),
                "min_price": int(r.get("min_price", 0)),
                "max_price": int(r.get("max_price", 0)),
                "modal_price": int(r.get("modal_price", 0)),
                "unit": "Quintal",
                "date": r.get("arrival_date", ""),
            }
            for r in records
            if r.get("modal_price")
        ]

    except Exception as e:
        print(f"[MandiService] API error: {e} — using fallback data")
        return _fallback_mandi_data()


def _fallback_mandi_data() -> list:
    """Static fallback data shown when API key is not set or API is down."""
    return [
        {"crop": "Wheat", "mandi": "Narwana", "state": "Haryana", "min_price": 2180, "max_price": 2320, "modal_price": 2275, "unit": "Quintal"},
        {"crop": "Mustard", "mandi": "Hisar", "state": "Haryana", "min_price": 5200, "max_price": 5680, "modal_price": 5480, "unit": "Quintal"},
        {"crop": "Bajra", "mandi": "Bhiwani", "state": "Haryana", "min_price": 1900, "max_price": 2050, "modal_price": 1980, "unit": "Quintal"},
        {"crop": "Rice", "mandi": "Karnal", "state": "Haryana", "min_price": 2800, "max_price": 3500, "modal_price": 3150, "unit": "Quintal"},
        {"crop": "Cotton", "mandi": "Sirsa", "state": "Haryana", "min_price": 6200, "max_price": 6800, "modal_price": 6540, "unit": "Quintal"},
        {"crop": "Maize", "mandi": "Rohtak", "state": "Haryana", "min_price": 1650, "max_price": 1780, "modal_price": 1720, "unit": "Quintal"},
    ]
