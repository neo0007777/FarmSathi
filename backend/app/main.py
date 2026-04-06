import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.routes import chat, diagnose, schemes, weather, mandi, advisor

load_dotenv(override=True)

app = FastAPI(
    title="FarmSathi API",
    description="AI-powered farming assistant for Indian farmers — RAG + Groq + Pinecone",
    version="1.0.0",
)

# CORS — allow frontend dev server
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routes under /api prefix
app.include_router(chat.router,     prefix="/api", tags=["Chat"])
app.include_router(diagnose.router, prefix="/api", tags=["Diagnose"])
app.include_router(schemes.router,  prefix="/api", tags=["Schemes"])
app.include_router(weather.router,  prefix="/api", tags=["Weather"])
app.include_router(mandi.router,    prefix="/api", tags=["Mandi"])
app.include_router(advisor.router,  prefix="/api", tags=["Advisor"])


@app.get("/")
def root():
    return {"status": "FarmSathi API is running", "docs": "/docs"}


@app.get("/api/ping")
def ping():
    """Health check — test this first after starting the server."""
    return {"ping": "pong", "status": "ok"}
