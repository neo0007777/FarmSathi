from fastapi import APIRouter, HTTPException
from app.models.schemas import ChatRequest, ChatResponse
from app.rag.pipeline import run_rag_pipeline

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """
    Main chat endpoint. Accepts a user message + optional conversation history.
    Runs RAG pipeline (Pinecone → Groq) and returns a grounded answer.

    Request body:
    {
        "message": "Meri gehun ki fasal mein rust aa gayi hai",
        "language": "hi",
        "history": [
            {"role": "user", "content": "..."},
            {"role": "assistant", "content": "..."}
        ]
    }
    """
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        reply, sources = run_rag_pipeline(
            user_message=req.message,
            history=req.history,
            top_k=5,
        )
        return ChatResponse(reply=reply, sources=sources, language=req.language)

    except Exception as e:
        print(f"[ChatRoute] Error: {e}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
