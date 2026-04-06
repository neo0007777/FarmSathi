import httpx

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

# WMO weather code → human description
WMO_CODES = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Foggy", 48: "Icy fog",
    51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
    61: "Light rain", 63: "Moderate rain", 65: "Heavy rain",
    71: "Light snow", 73: "Moderate snow", 75: "Heavy snow",
    80: "Rain showers", 81: "Heavy showers", 82: "Violent showers",
    95: "Thunderstorm", 96: "Thunderstorm with hail",
}


async def get_weather(lat: float, lon: float) -> dict:
    """
    Fetch current weather + 3-day rain forecast using Open-Meteo.
    Returns a dict ready for WeatherResponse.
    """
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": ["temperature_2m", "relative_humidity_2m", "wind_speed_10m", "weather_code"],
        "daily": ["precipitation_sum"],
        "forecast_days": 3,
        "timezone": "Asia/Kolkata",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(OPEN_METEO_URL, params=params)
        resp.raise_for_status()
        data = resp.json()

    try:
        current = data["current"]
        daily = data["daily"]
    except KeyError as e:
        raise RuntimeError(f"Unexpected Open-Meteo response format: missing key {e}")

    temp = round(current["temperature_2m"], 1)
    humidity = current["relative_humidity_2m"]
    wind = round(current["wind_speed_10m"], 1)
    code = current.get("weather_code", 0)
    description = WMO_CODES.get(code, "Unknown")
    rain_3day = round(sum(daily.get("precipitation_sum", [0, 0, 0])), 1)

    sowing_advice = _sowing_advice(temp, humidity, rain_3day)

    return {
        "temperature": temp,
        "humidity": humidity,
        "wind_speed": wind,
        "description": description,
        "rain_3day_mm": rain_3day,
        "sowing_advice": sowing_advice,
    }


def _sowing_advice(temp: float, humidity: float, rain_3day: float) -> str:
    if rain_3day > 30:
        return "Heavy rain expected — delay sowing and avoid fertilizer application for 3 days"
    if temp > 40:
        return "Very high temperature — sow in evening hours and ensure adequate irrigation"
    if temp < 10:
        return "Low temperature — not suitable for most Kharif crops, wait for warming"
    if humidity > 85:
        return "High humidity — monitor for fungal diseases. Avoid overhead irrigation"
    return "Weather conditions are good for sowing and field operations"
