from pydantic import BaseModel
from typing import Optional, List


class ChatRequest(BaseModel):
    message: str
    language: str = "hi"           # "hi" or "en"
    history: List[dict] = []       # [{"role":"user","content":"..."}]


class ChatResponse(BaseModel):
    reply: str
    sources: List[str] = []
    language: str


class DiagnoseResponse(BaseModel):
    disease_name: str
    confidence: int
    crop: str
    treatment_steps: List[str]
    sources: List[str]


class WeatherResponse(BaseModel):
    temperature: float
    humidity: float
    wind_speed: float
    description: str
    rain_3day_mm: float
    sowing_advice: str


class MandiRecord(BaseModel):
    crop: str
    mandi: str
    state: str
    min_price: int
    max_price: int
    modal_price: int
    unit: str = "Quintal"


class SchemeResult(BaseModel):
    title: str
    org: str
    description: str
    benefit: str
    tags: List[str]
    apply_link: str = ""


class CropRecommendation(BaseModel):
    crop_name: str
    variety: str
    match_score: int
    expected_yield: str
    market_price: str
    water_requirement: str
    duration_days: int
    source: str
