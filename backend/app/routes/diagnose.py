import base64
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.models.schemas import DiagnoseResponse
from app.services.groq_client import vision_completion
from app.rag.pipeline import run_disease_rag
import re

router = APIRouter()

VISION_PROMPT = """You are an expert agricultural plant pathologist.
Analyze this crop leaf/plant image carefully and respond ONLY in this exact JSON format:

{
  "disease_name": "Full disease name with scientific name in brackets",
  "confidence": 85,
  "crop": "Crop name",
  "severity": "mild|moderate|severe"
}

Be specific. If no disease is visible, set disease_name to "Healthy Plant" and confidence to 95.
Do not add any text outside the JSON."""


@router.post("/diagnose", response_model=DiagnoseResponse)
async def diagnose(
    file: UploadFile = File(...),
    crop_hint: str = Form(default=""),   # optional: "wheat", "rice" etc.
):
    """
    Crop disease diagnosis endpoint.
    Accepts an image file, sends to Groq vision model, then retrieves
    treatment plan from Pinecone RAG.

    Form fields:
    - file: image file (JPG/PNG)
    - crop_hint: optional crop name to improve accuracy
    """
    # Validate file type
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, or WebP images are supported")

    # Read + encode to base64
    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="Image too large. Max 10MB.")

    image_b64 = base64.b64encode(image_bytes).decode("utf-8")
    media_type = file.content_type

    # Step 1: Vision model identifies disease
    try:
        raw_json = vision_completion(image_b64, VISION_PROMPT, media_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vision model error: {str(e)}")

    # Parse JSON from vision model response
    vision_data = _parse_vision_response(raw_json)
    disease_name = vision_data.get("disease_name", "Unknown disease")
    confidence = int(vision_data.get("confidence", 70))
    crop = vision_data.get("crop", crop_hint or "Unknown crop")

    # Step 2: RAG retrieves treatment plan
    if disease_name.lower() == "healthy plant":
        treatment_steps = ["No disease detected. Continue regular monitoring.", "Maintain proper irrigation schedule.", "Apply balanced NPK fertilizer as per crop stage."]
        sources = ["ICAR General Crop Management Guide"]
    else:
        try:
            treatment_text, sources = run_disease_rag(disease_name)
            treatment_steps = _parse_treatment_steps(treatment_text)
        except Exception as e:
            print(f"[DiagnoseRoute] RAG error: {e}")
            treatment_steps = [f"Disease identified: {disease_name}. Consult your local KVK for treatment advice."]
            sources = []

    return DiagnoseResponse(
        disease_name=disease_name,
        confidence=confidence,
        crop=crop,
        treatment_steps=treatment_steps,
        sources=sources,
    )


def _parse_vision_response(raw: str) -> dict:
    """Extract JSON from vision model response, handling extra text."""
    import json
    # Try direct parse first
    try:
        return json.loads(raw)
    except Exception:
        pass
    # Extract JSON block from mixed text
    match = re.search(r'\{.*?\}', raw, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except Exception:
            pass
    return {"disease_name": "Unable to identify", "confidence": 50, "crop": "Unknown", "severity": "unknown"}


def _parse_treatment_steps(text: str) -> list:
    """Convert LLM treatment text into a clean list of steps."""
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    steps = []
    for line in lines:
        # Remove common list prefixes: "1.", "- ", "* ", "Step 1:"
        clean = re.sub(r'^(\d+[\.\)]\s*|[-*•]\s*|step\s*\d+[:\s]*)', '', line, flags=re.IGNORECASE)
        if clean and len(clean) > 10:
            steps.append(clean)
    return steps[:6] if steps else [text[:500]]
