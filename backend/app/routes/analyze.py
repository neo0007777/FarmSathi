"""
/api/analyze  — YOLO + LLM Crop Pathology Endpoint
====================================================
Accepts:
  A) JSON body with pre-computed YOLO detections (from your own YOLO model)
  B) An uploaded image  — the endpoint runs a lightweight vision-based
     detection simulation and then passes results to the LLM analyzer.

Both paths return the same JSON shape:
  {
      "detections": [{"disease": ..., "confidence": ...}, ...],
      "analysis":   "LLM generated explanation"
  }
"""

import base64
import json
import re

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional

from app.services.pathology_analyzer import analyze_detections
from app.services.groq_client import vision_completion

router = APIRouter()


# ── Request / Response models ─────────────────────────────────────────────────

class Detection(BaseModel):
    disease: str
    confidence: float


class AnalyzeRequest(BaseModel):
    """JSON body when caller already has YOLO detections."""
    detections: List[Detection]


# ── Vision helper — converts image → detection list ───────────────────────────

_DETECT_PROMPT = """You are a plant disease detector. Analyze this crop image.
Return ONLY a valid JSON array (no other text) like:
[{"disease": "leaf_blight", "confidence": 87.5}]

Rules:
- List every visible disease/pest you detect (max 3 items).
- Use short snake_case disease names (e.g. powdery_mildew, rust, aphids).
- If crop looks healthy, return: [{"disease": "healthy", "confidence": 97.0}]
- Confidence is 0-100. Be accurate."""


def _run_vision_detection(image_b64: str, media_type: str) -> List[dict]:
    """Use Groq vision to convert raw image into detections list."""
    raw = vision_completion(image_b64, _DETECT_PROMPT, media_type)
    # Extract JSON array from response
    match = re.search(r'\[.*?\]', raw, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    # Fallback if parsing fails
    return [{"disease": "unable_to_detect", "confidence": 50.0}]


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/analyze")
async def analyze_from_detections(request: AnalyzeRequest):
    """
    Path A: Accept pre-computed YOLO detections and return LLM analysis.

    Body:
        {"detections": [{"disease": "leaf_blight", "confidence": 91.2}]}

    Returns:
        {"detections": [...], "analysis": "..."}
    """
    detections = [d.model_dump() for d in request.detections]
    result = analyze_detections(detections)
    return JSONResponse(content=result)


@router.post("/analyze/image")
async def analyze_from_image(file: UploadFile = File(...)):
    """
    Path B: Accept a raw image, run vision-based detection, then return LLM analysis.
    This mirrors a real YOLO pipeline — vision model acts as the detector.

    Form fields:
        file: image (JPEG / PNG / WebP)

    Returns:
        {"detections": [...], "analysis": "..."}
    """
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, or WebP images are supported."
        )

    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:  # 10 MB cap
        raise HTTPException(status_code=400, detail="Image too large. Max 10 MB.")

    image_b64 = base64.b64encode(image_bytes).decode("utf-8")

    # Step 1: Vision model → detections (simulates YOLO output)
    try:
        detections = _run_vision_detection(image_b64, file.content_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vision detection error: {e}")

    # Step 2: LLM analyzer → explanation
    try:
        result = analyze_detections(detections)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM analysis error: {e}")

    return JSONResponse(content=result)
