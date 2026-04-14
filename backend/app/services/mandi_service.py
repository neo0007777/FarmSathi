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
        print("[MandiService] DATA_GOV_API_KEY not set — using fallback data")
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

        if resp.status_code != 200:
            print(f"[MandiService] HTTP {resp.status_code} — response: {resp.text[:300]}")
            return _fallback_mandi_data()

        data = resp.json()
        records = data.get("records", [])

        if not records:
            print(f"[MandiService] No records returned for state={state}. Full response: {data}")
            return _fallback_mandi_data()

        parsed = []
        for r in records:
            try:
                modal = _safe_int(r.get("modal_price"))
                if modal == 0:
                    continue
                parsed.append({
                    "crop":        r.get("commodity", ""),
                    "mandi":       r.get("market", ""),
                    "state":       r.get("state", ""),
                    "district":    r.get("district", ""),
                    "min_price":   _safe_int(r.get("min_price")),
                    "max_price":   _safe_int(r.get("max_price")),
                    "modal_price": modal,
                    "unit":        "Quintal",
                    "date":        r.get("arrival_date", ""),
                })
            except Exception as row_err:
                print(f"[MandiService] Row parse error: {row_err} — row: {r}")

        print(f"[MandiService] Fetched {len(parsed)} records for state={state}")
        return parsed if parsed else _fallback_mandi_data()

    except Exception as e:
        print(f"[MandiService] API error: {type(e).__name__}: {e} — using fallback data")
        return _fallback_mandi_data()


def _safe_int(value) -> int:
    """Convert value to int safely, returning 0 on failure."""
    try:
        return int(float(str(value).strip())) if value not in (None, "", " ") else 0
    except (ValueError, TypeError):
        return 0


def _fallback_mandi_data() -> list:
    """Static fallback data shown when API key is not set or API is down."""
    return [
        {"crop": "Wheat",   "mandi": "Narwana",  "state": "Haryana", "district": "Jind",    "min_price": 2180, "max_price": 2320, "modal_price": 2275, "unit": "Quintal", "date": ""},
        {"crop": "Mustard", "mandi": "Hisar",     "state": "Haryana", "district": "Hisar",   "min_price": 5200, "max_price": 5680, "modal_price": 5480, "unit": "Quintal", "date": ""},
        {"crop": "Bajra",   "mandi": "Bhiwani",   "state": "Haryana", "district": "Bhiwani", "min_price": 1900, "max_price": 2050, "modal_price": 1980, "unit": "Quintal", "date": ""},
        {"crop": "Rice",    "mandi": "Karnal",    "state": "Haryana", "district": "Karnal",  "min_price": 2800, "max_price": 3500, "modal_price": 3150, "unit": "Quintal", "date": ""},
        {"crop": "Cotton",  "mandi": "Sirsa",     "state": "Haryana", "district": "Sirsa",   "min_price": 6200, "max_price": 6800, "modal_price": 6540, "unit": "Quintal", "date": ""},
        {"crop": "Maize",   "mandi": "Rohtak",    "state": "Haryana", "district": "Rohtak",  "min_price": 1650, "max_price": 1780, "modal_price": 1720, "unit": "Quintal", "date": ""},
    ]
