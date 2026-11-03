"""FastAPI backend for AI Shopping Assistant.

Exposes REST endpoints for:
- Chat and RAG retrieval
- Product browsing & filtering
- Category listing
- Product comparison
- Cart validation
"""

import logging
import math
import os
import uuid
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from chatbot.conversation_manager import AssistantResponse, ConversationManager
from chatbot.intent_detector import IntentDetector
from chatbot.shopping_assistant import ShoppingAssistant
from components.product_cards import comparison_frame
from components.shopping_cart import Cart
from config import (
    DATA_PATH,
    FREE_MODE,
    GROQ_API_KEY_ENV,
    GROQ_DEFAULT_MODEL,
    INDEX_DIR,
    OPENAI_API_KEY_ENV,
    PAID_MODE,
)
from rag.embeddings.embedding_model import get_embeddings
from rag.ingestion.product_ingestion import load_products
from rag.llm.llm_factory import LLMSettings
from rag.retrieval.product_filter import SearchFilters, apply_filters, sort_products
from rag.retrieval.product_retriever import ProductRetriever
from rag.vectorstore.faiss_manager import FaissManager
from utils.helpers import file_fingerprint

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("backend")

# Global pipeline singletons
PIPELINE: Dict[str, Any] = {}
SESSIONS: Dict[str, Dict[str, Any]] = {}


def serialize_product(row: pd.Series) -> dict:
    return {
        "product_id": str(row["product_id"]),
        "name": str(row["name"]),
        "category": str(row["category"]),
        "subcategory": str(row["subcategory"]),
        "brand": str(row["brand"]),
        "price": float(row["price"]),
        "discount_percent": float(row["discount_percent"]),
        "sale_price": float(row["sale_price"]),
        "rating": float(row["rating"]),
        "review_count": int(row["review_count"]),
        "stock_quantity": int(row["stock_quantity"]),
        "in_stock": bool(row["in_stock"]),
        "material": str(row.get("material", "")),
        "description": str(row.get("description", "")),
        "sizes": [s.strip() for s in str(row.get("sizes", "")).split(",") if s.strip()],
        "colors": [c.strip() for c in str(row.get("colors", "")).split(",") if c.strip()],
        "tags": [t.strip() for t in str(row.get("tags", "")).split(",") if t.strip()],
    }


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing RAG pipeline and dataset...")
    df = load_products(DATA_PATH)
    fingerprint = file_fingerprint(DATA_PATH)
    embeddings = get_embeddings()
    faiss_mgr = FaissManager(INDEX_DIR, embeddings)
    faiss_mgr.load_or_build(df, fingerprint)
    retriever = ProductRetriever(df, faiss_mgr)
    detector = IntentDetector(df)
    assistant = ShoppingAssistant(df, retriever, detector)

    PIPELINE["df"] = df
    PIPELINE["faiss"] = faiss_mgr
    PIPELINE["retriever"] = retriever
    PIPELINE["detector"] = detector
    PIPELINE["assistant"] = assistant
    logger.info("Shopping Assistant backend initialized with %d products.", len(df))
    yield
    PIPELINE.clear()
    SESSIONS.clear()


app = FastAPI(
    title="AI Shopping Assistant API",
    description="High-performance backend for AI Shopping Assistant with RAG, FAISS & Groq/OpenAI",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for Vercel, localhost, and custom domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------- Models
class FilterParams(BaseModel):
    category: Optional[str] = None
    subcategory: Optional[str] = None
    brands: Optional[List[str]] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_rating: Optional[float] = None
    colors: Optional[List[str]] = None
    sizes: Optional[List[str]] = None
    in_stock_only: Optional[bool] = None
    sort_by: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    filters: Optional[FilterParams] = None
    cart_items: Optional[Dict[str, int]] = None
    cart_variants: Optional[Dict[str, dict]] = None
    api_key: Optional[str] = None
    llm_mode: Optional[str] = "Free (Groq)"
    llm_model: Optional[str] = "openai/gpt-oss-120b"


class CompareRequest(BaseModel):
    product_ids: List[str]


class AddToCartRequest(BaseModel):
    product_id: str
    quantity: int = 1
    size: Optional[str] = None
    colour: Optional[str] = None
    session_id: Optional[str] = None


# --------------------------------------------------------------------------- Endpoints
@app.get("/api/health")
def health_check():
    df = PIPELINE.get("df")
    faiss_mgr = PIPELINE.get("faiss")
    return {
        "status": "healthy",
        "products_count": len(df) if df is not None else 0,
        "faiss_ready": faiss_mgr is not None and faiss_mgr.store is not None,
    }


@app.get("/api/categories")
def get_categories():
    df = PIPELINE["df"]
    cats = {}
    for cat in sorted(df["category"].unique()):
        sub_df = df[df["category"] == cat]
        cats[cat] = {
            "count": len(sub_df),
            "subcategories": [
                {"name": sub, "count": len(sub_df[sub_df["subcategory"] == sub])}
                for sub in sorted(sub_df["subcategory"].unique())
            ],
        }
    return {
        "categories": cats,
        "brands": sorted(df["brand"].unique()),
        "colors": sorted({c for v in df["_colors"] for c in v}),
        "sizes": sorted({s for v in df["sizes"] for s in v.split(",") if s.strip()}),
        "price_min": float(df["sale_price"].min()),
        "price_max": float(df["sale_price"].max()),
    }


@app.get("/api/products")
def list_products(
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
    brand: Optional[List[str]] = Query(None),
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
    in_stock_only: Optional[bool] = None,
    sort_by: Optional[str] = None,
    page: int = 1,
    page_size: int = 12,
):
    df = PIPELINE["df"]
    f = SearchFilters(
        category=category,
        subcategory=subcategory,
        brands=brand or [],
        min_price=min_price,
        max_price=max_price,
        min_rating=min_rating,
        in_stock_only=bool(in_stock_only),
        sort_by=sort_by,
    )
    filtered = apply_filters(df, f)
    ordered = sort_products(filtered, f.sort_by)
    total = len(ordered)
    start = (page - 1) * page_size
    end = start + page_size
    sliced = ordered.iloc[start:end]

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": math.ceil(total / page_size) if page_size else 1,
        "products": [serialize_product(row) for _, row in sliced.iterrows()],
    }


@app.get("/api/products/{product_id}")
def get_product(product_id: str):
    df = PIPELINE["df"]
    if product_id not in df.index:
        raise HTTPException(status_code=404, detail="Product not found")
    return serialize_product(df.loc[product_id])


@app.post("/api/compare")
def compare_products(req: CompareRequest):
    df = PIPELINE["df"]
    valid_ids = [pid for pid in req.product_ids if pid in df.index]
    if len(valid_ids) < 2:
        raise HTTPException(status_code=400, detail="Provide at least 2 valid product IDs to compare.")

    frame = comparison_frame(df, valid_ids)
    # Convert comparison frame to dictionary format
    result = {}
    for col in frame.columns:
        result[col] = frame[col].to_dict()

    return {
        "products": [serialize_product(df.loc[pid]) for pid in valid_ids],
        "comparison_table": result,
    }


@app.post("/api/chat")
def chat(req: ChatRequest):
    df = PIPELINE["df"]
    assistant: ShoppingAssistant = PIPELINE["assistant"]

    # Session management
    session_id = req.session_id or str(uuid.uuid4())
    if session_id not in SESSIONS:
        SESSIONS[session_id] = {
            "messages": [],
            "shopping_context": None,
            "cart": {},
            "cart_variants": {},
        }
    session_state = SESSIONS[session_id]

    # Sync client cart if provided
    if req.cart_items is not None:
        session_state["cart"] = req.cart_items
    if req.cart_variants is not None:
        session_state["cart_variants"] = req.cart_variants

    convo = ConversationManager(session_state)
    cart = Cart(session_state, df)

    # Configure LLM settings
    api_key = req.api_key or os.getenv(GROQ_API_KEY_ENV if req.llm_mode == FREE_MODE else OPENAI_API_KEY_ENV, "")
    llm = LLMSettings(
        mode=req.llm_mode or FREE_MODE,
        model=req.llm_model or GROQ_DEFAULT_MODEL,
        api_key=api_key,
    )

    # Search filters
    f = None
    if req.filters:
        f = SearchFilters(
            category=req.filters.category,
            subcategory=req.filters.subcategory,
            brands=req.filters.brands or [],
            min_price=req.filters.min_price,
            max_price=req.filters.max_price,
            min_rating=req.filters.min_rating,
            in_stock_only=bool(req.filters.in_stock_only),
            sort_by=req.filters.sort_by,
        )

    # Process message
    convo.add_user(req.message)
    response: AssistantResponse = assistant.handle_message(req.message, convo, cart, llm, f)
    convo.add_assistant(response)

    # Gather matching product cards
    products = [serialize_product(df.loc[pid]) for pid in response.product_ids if pid in df.index]

    return {
        "session_id": session_id,
        "text": response.text,
        "kind": response.kind,
        "product_ids": response.product_ids,
        "products": products,
        "category_options": response.category_options,
        "compare_ids": response.compare_ids,
        "followups": response.followups,
        "cart": {
            "items": cart.items,
            "variants": cart.variants,
            "total_count": sum(cart.items.values()),
        },
    }


# Serve static frontend if directory exists
frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
