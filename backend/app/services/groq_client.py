import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

_client = None


def get_groq_client() -> Groq:
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not set in .env")
        _client = Groq(api_key=api_key)
    return _client


def chat_completion(messages: list, model: str = "llama-3.3-70b-versatile", max_tokens: int = 1024) -> str:
    """
    Send messages to Groq and return the response text.
    messages = [{"role": "system"|"user"|"assistant", "content": "..."}]
    """
    client = get_groq_client()
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        max_tokens=max_tokens,
        temperature=0.4,
    )
    return response.choices[0].message.content


def vision_completion(image_base64: str, prompt: str, media_type: str = "image/jpeg") -> str:
    """
    Send an image to Groq vision model and return the response text.
    Uses meta-llama/llama-4-scout-17b-16e-instruct (Groq's active vision model).
    """
    client = get_groq_client()
    response = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{media_type};base64,{image_base64}"
                        },
                    },
                    {"type": "text", "text": prompt},
                ],
            }
        ],
        max_tokens=1024,
        temperature=0.2,
    )
    return response.choices[0].message.content
