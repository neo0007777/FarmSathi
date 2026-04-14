# FarmSathi Intelligence

FarmSathi is a premium, AI-powered agricultural advisory platform designed specifically for Indian farmers. It combines state-of-the-art Large Language Models (LLMs), Retrieval-Augmented Generation (RAG) using Pinecone, and real-time open government data to provide unparalleled agricultural guidance.

![FarmSathi Overview](https://raw.githubusercontent.com/neo0007777/FarmSathi/main/frontend/public/favicon.svg)

## Features

- **Advisory Chat:** An intelligent chat interface powered by Groq and Llama-3 that contextually references real agricultural schemes and practices using RAG.
- **Crop Pathology Engine:** Diagnoses crop health issues and provides structured, expert-verified interventions with high-confidence warnings.
- **Government Schemes Directory:** Automatically synchronized central and state-level subsidy, insurance, and loan schemas for straightforward capital allocation.
- **Real-Time Mandi Markets:** Live commodity price streaming across agricultural markets integrated with Data.gov.in.
- **Micro-Climate Weather Dashboard:** High-contrast, dynamic weather visualizations integrated with real-time sowing and harvesting recommendations.

## Tech Stack

**Frontend (Client)**
- React 19 + Vite
- Tailwind CSS 4 (Custom high-contrast semantic design)
- Framer Motion (Micro-animations)
- React Router DOM
- i18next (Multilingual support for English & Hindi)

**Backend (API Server)**
- FastAPI (High-performance async Python framework)
- Python 3.11
- Uvicorn
- Groq (LLM Inference engine)
- Pinecone (Vector database for RAG)
- Sentence Transformers (Semantic embeddings)

---

## 🛠️ Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/neo0007777/FarmSathi.git
cd FarmSathi
```

### 2. Backend Setup
The backend runs on Python 3.11 with FastAPI.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:
```env
# Required API Keys
GROQ_API_KEY=your_groq_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=farmsathi-docs-384
DATA_GOV_API_KEY=your_datagov_api_key

# Optional (Defaults to local Vite dev server)
FRONTEND_URL=http://localhost:5173 
```

Start the backend API server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
*API docs will be available at `http://localhost:8000/docs`.*

### 3. Frontend Setup
The frontend runs on React + Vite.

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory (optional for local dev if using Vite Proxy):
```env
# Point this to your backend url in production
VITE_API_URL=http://localhost:8000
```

Start the development server:
```bash
npm run dev
```
*The web app will run at `http://localhost:5173`.*

---

## 🚀 Deployment

This application is configured for production-grade deployment across cloud providers.

### Backend (Render)
The backend is optimized for Render deployments via a configured blueprint.
- **Root Directory:** `backend`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
*Automatically forces `Python 3.11.9` via `.python-version` and utilizes CPU-only PyTorch to minimize build size.*

### Frontend (Vercel)
The frontend is optimized for zero-config Vercel deployment.
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variables:** Must include `VITE_API_URL` pointing to the live Render backend URL (`https://your-api.onrender.com`).

---
*Created by [Shiv](https://github.com/neo0007777)*
