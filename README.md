# 🛍️ ShopMind AI — Grounded Shopping Assistant & Chrome Copilot

A full-stack, enterprise-grade AI Shopping Assistant powered by **Retrieval-Augmented Generation (RAG)**, **FAISS Vector Search**, and **Groq/OpenAI LLMs**. Features a decoupled high-performance **FastAPI Backend**, a stunning **Vanilla HTML/CSS Frontend** for Vercel, and a **Google Chrome Extension (Side Panel)** for live e-commerce stores (Amazon, Flipkart, etc.).

---

## 🏛️ System Architecture

```text
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                                CLIENT APPS                                  │
 ├──────────────────────────────────────┬──────────────────────────────────────┤
 │  🌐 Web App (Vercel)                 │  🧩 Chrome Extension (Side Panel)    │
 │  • Pure Vanilla HTML5/CSS3/JS        │  • Live Amazon/Flipkart scraping     │
 │  • Persistent localStorage Cart      │  • AI Deal Score & Sentiment Review  │
 │  • Product Search & Comparison       │  • Contextual "Ask About Product"    │
 └───────────────────┬──────────────────┴───────────────────┬──────────────────┘
                     │                                      │
                     │          REST API (HTTP / JSON)      │
                     ▼                                      ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                         FASTAPI BACKEND (Uvicorn / Docker)                  │
 │                                                                             │
 │  /api/health       /api/products       /api/compare                         │
 │  /api/categories   /api/chat           /api/analyze-product                 │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                            RAG INTELLIGENCE ENGINE                          │
 │                                                                             │
 │  1. Intent Detector     Rule-based & semantic query parser                  │
 │  2. SentenceTransformer all-MiniLM-L6-v2 (384-dimensional cosine vectors)   │
 │  3. FAISS Vectorstore   Index of 1,000 pre-embedded catalog items           │
 │  4. Strict Filtering    Pandas price bounds, size, color, stock filters     │
 │  5. LLM Synthesis       Groq (GPT-OSS-120B) or OpenAI with guardrails       │
 └─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📂 Project Directory Structure

```text
vish-task-shopping-assistant/
│
├── frontend/                          ✨ Vercel Static Frontend
│   ├── index.html                     # Semantic HTML5 UI with mobile-first grid
│   ├── style.css                      # Modern Vanilla CSS (Glassmorphism & Dark Mode)
│   ├── app.js                         # State store, localStorage Cart, Chat & Modals
│   ├── vercel.json                    # Vercel deployment & security headers
│   └── README.md                      # Frontend documentation & design guide
│
├── backend/                           ⚡ FastAPI Async REST Backend
│   ├── __init__.py
│   ├── main.py                        # REST routes (/api/chat, /api/products, etc.)
│   └── README.md                      # API reference & endpoint guide
│
├── extension/                         🛍️ Google Chrome Extension (Manifest V3)
│   ├── manifest.json                  # Manifest V3 (sidePanel, activeTab permissions)
│   ├── background.js                  # Service worker handling side panel activation
│   ├── content.js                     # Amazon & Flipkart product/review DOM extractor
│   ├── sidepanel.html                 # AI Copilot UI layout
│   ├── sidepanel.css                  # Sidepanel stylesheet
│   ├── sidepanel.js                   # Client controller & API integration
│   ├── icons/                         # 16px, 48px, 128px extension icons
│   └── README.md                      # Chrome installation guide
│
├── rag/                               🧠 Core Retrieval-Augmented Generation Engine
│   ├── ingestion/                     # Dataset cleaning, type coercion & validation
│   ├── embeddings/                    # HuggingFace sentence-transformers embeddings
│   ├── vectorstore/                   # FAISS index storage & cross-platform loader
│   ├── retrieval/                     # Semantic search, filter pipelines & ranker
│   └── llm/                           # LLM factory (Groq / OpenAI) & prompt guards
│
├── chatbot/                           💬 Dialogue & Intent Processing
│   ├── conversation_manager.py        # Multi-turn conversational context
│   ├── intent_detector.py             # Vocabulary-driven intent and slot extractor
│   └── shopping_assistant.py          # Master response orchestrator
│
├── components/                        🛒 Reusable Logic Components
│   ├── shopping_cart.py               # Cart operations, validation & variant tracking
│   ├── product_cards.py               # Comparison frames & card HTML formatters
│   └── category_buttons.py
│
├── data/                              📂 Catalog Dataset
│   └── ecommerce_products_1000.csv    # 1,000 verified product rows
│
├── utils/                             🛠️ Helpers & Utilities
│   └── helpers.py                     # Currency formatter & LF-normalized fingerprint
│
├── Dockerfile                         🐳 Multi-stage production container
├── docker-compose.yml                 🐳 One-click Docker container orchestration
├── .dockerignore                      # Docker ignore rules
├── requirements.txt                   📦 Python dependencies
├── config.py                          ⚙️ Global configuration & hyperparameters
├── .python-version                    # Python 3.11.9 pin for cloud buildpacks
└── app.py                             🛍️ Legacy Streamlit application (backward compatible)
```

---

## 🚀 Quickstart Guide

### 1. Run with Docker (Fastest):
```bash
docker compose up --build
```
Access the application at [http://localhost:8000](http://localhost:8000).

---

### 2. Run Manually (Local Setup):

#### Prerequisites:
- Python 3.11 (`py -3.11` or via `uv`)

```powershell
# 1. Create and activate virtual environment
py -3.11 -m venv .venv
.venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start the FastAPI backend
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

- **Backend API:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Frontend App:** Open `frontend/index.html` directly in any browser!

---

### 3. Install the Chrome Extension:
1. Open Google Chrome and navigate to `chrome://extensions`.
2. Toggle **Developer mode** ON (top-right).
3. Click **Load unpacked** (top-left) and select the `extension` folder inside this project.
4. Open Amazon or Flipkart, click the **ShopMind AI** icon, and explore!

---

## ☁️ Deployment

### Deploy Frontend to Vercel (0s Cold Start):
1. Import `ramashishmaurya/shopping_assistance` on [vercel.com](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Click **Deploy**.

### Deploy Backend to Render:
1. Create a new **Web Service** on [render.com](https://render.com).
2. Connect this repository with settings:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables:** `PYTHON_VERSION=3.11.9`
3. Click **Deploy Web Service**.

---

## 🔒 Grounded AI Guarantee
The search engine strictly dictates which products are shown. The LLM only formats conversational responses, and an ungrounded claim filter ensures no fake prices, hallucinated specs, or imaginary products are ever displayed.
