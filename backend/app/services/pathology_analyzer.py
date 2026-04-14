"""
Pathology Analyzer — Honest LLM Verification Layer on top of YOLO detections
==============================================================================
Pipeline:  Image → YOLO detections → create_prompt() → get_llm_response() → JSON output

Design philosophy:
  - The LLM acts as a SECOND OPINION, not a rubber stamp.
  - It verifies whether symptoms actually match the detected disease.
  - Treatment is only given when confidence is HIGH and symptoms are clear.
  - Uncertain or stress-related issues are flagged honestly.
"""

from typing import List, Dict
from app.services.groq_client import chat_completion

# Confidence thresholds
CONFIRMED_THRESHOLD   = 75.0   # above this → eligible for confirmed diagnosis
UNCERTAIN_THRESHOLD   = 60.0   # below this → always mark as uncertain


def _confidence_label(confidence: float) -> str:
    """Translate a float confidence into a human-readable signal."""
    if confidence >= CONFIRMED_THRESHOLD:
        return f"{confidence:.1f}% — strong signal"
    elif confidence >= UNCERTAIN_THRESHOLD:
        return f"{confidence:.1f}% — moderate signal, verify manually"
    return f"{confidence:.1f}% — WEAK signal, likely uncertain or stress-related"


def create_prompt(detections: List[Dict]) -> str:
    """
    Build a strict, honest verification prompt from YOLO detections.

    The LLM is instructed to:
      - NOT assume the detection is correct
      - Verify symptoms vs disease
      - Output CONFIRMED or UNCERTAIN diagnosis
      - Only provide treatment if CONFIRMED

    Args:
        detections: list of {"disease": str, "confidence": float}

    Returns:
        Structured prompt string for the LLM.
    """
    if not detections:
        return ""

    detection_lines = []
    for d in detections:
        label = d.get("disease", "unknown").replace("_", " ").title()
        conf  = float(d.get("confidence", 0.0))
        detection_lines.append(f"- Detected: {label} | Confidence: {_confidence_label(conf)}")

    detections_text = "\n".join(detection_lines)

    prompt = f"""You are a senior agricultural pathologist reviewing an automated AI crop scan.

The detection model flagged the following:

{detections_text}

⚠️ STRICT RULES — follow these exactly:
1. Do NOT assume the detection is correct just because the model said so.
2. Evaluate whether the named disease typically shows symptoms that match what a camera scan would find.
3. If confidence is below 75% OR the disease name is vague/generic → mark as UNCERTAIN.
4. Only give treatment steps if you mark the diagnosis as CONFIRMED.
5. Be honest. Farmers depend on you. A wrong treatment is worse than no treatment.

For EACH detection, respond in this exact structure:

### [Detection Name]

**Diagnosis:** CONFIRMED / UNCERTAIN

**Reasoning:**
(2-3 sentences: Does this disease match the confidence level? Are camera-detectable symptoms likely? Call out if it could be stress, nutrient issue, or something else.)

**Treatment:** *(only if CONFIRMED)*
1. ...
2. ...
3. ...

**If UNCERTAIN — Observation Steps:**
- Wait X days and re-check
- Look for [specific visible symptom] before treating
- Consult local KVK if symptoms worsen

---

End with one honest overall summary sentence."""

    return prompt


def get_llm_response(prompt: str) -> str:
    """
    Send prompt to LLaMA via Groq.
    System role enforces the honest expert persona.

    Args:
        prompt: formatted string from create_prompt()

    Returns:
        LLM-generated verification report as string.
    """
    messages = [
        {
            "role": "system",
            "content": (
                "You are a cautious, honest agricultural pathologist. "
                "Your job is to VERIFY AI crop disease detections — not simply explain them. "
                "You must distinguish between confirmed disease, stress symptoms, and sensor noise. "
                "Never give treatment advice unless you are confident the diagnosis is correct. "
                "Use plain English. Farmers trust you — do not mislead them."
            ),
        },
        {"role": "user", "content": prompt},
    ]
    return chat_completion(messages, model="llama-3.1-8b-instant", max_tokens=800)


def analyze_detections(detections: List[Dict]) -> Dict:
    """
    Full pipeline: YOLO detections → honest LLM verification report.

    Args:
        detections: [{"disease": "leaf_blight", "confidence": 91.2}, ...]

    Returns:
        {
            "detections": [...],
            "analysis":   "LLM verification report",
            "verified":   True/False  (True if any detection is confirmed)
        }
    """
    # Edge case: nothing detected
    if not detections:
        return {
            "detections": [],
            "analysis": (
                "✅ No disease or pest was detected in this scan.\n\n"
                "Your crop appears healthy based on available visual data. "
                "Continue regular monitoring — check leaves every 7 days "
                "and maintain proper irrigation and fertilizer schedules."
            ),
            "verified": False,
        }

    # Filter: flag all weak-signal detections before sending to LLM
    any_strong = any(
        float(d.get("confidence", 0)) >= CONFIRMED_THRESHOLD
        for d in detections
    )

    prompt   = create_prompt(detections)
    analysis = get_llm_response(prompt)

    return {
        "detections": detections,
        "analysis":   analysis,
        "verified":   any_strong,
    }
