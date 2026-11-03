# ⚡ ShopMind AI — Backend (FastAPI + RAG Engine)

High-performance asynchronous REST API powering the AI Shopping Assistant web application and Chrome Extension.

---

## 🛠️ Tech Stack & Key Libraries
- **Framework:** FastAPI (ASGI async event loop via Uvicorn)
- **Vector Search:** FAISS (Facebook AI Similarity Search - CPU optimized)
- **Embeddings:** HuggingFace `sentence-transformers/all-MiniLM-L6-v2` (384-dimensional cosine vectors)
- **Data Engine:** Pandas (1,000 product catalog querying, filtering, and sorting)
- **LLM Orchestration:** LangChain Core + Groq API (`openai/gpt-oss-120b`) / OpenAI API
- **Data Validation:** Pydantic v2 schemas

---

## 🚀 Running the Backend

### Local Environment:
```powershell
# 1. Activate virtual environment
.venv\Scripts\activate

# 2. Run with hot-reload enabled
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
Once started, visit:
- **Interactive Swagger API Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Documentation:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

### Docker:
```bash
docker compose up --build
```

---

## 📡 API Reference

### 1. Health Check
`GET /api/health`
Returns system status, total loaded products count, and FAISS readiness.
```json
{
  "status": "healthy",
  "products_count": 1000,
  "faiss_ready": true
}
```

---

### 2. Chat & RAG Retrieval
`POST /api/chat`
Handles conversational messages, intent extraction, FAISS vector search, and LLM reply generation.

**Request Body:**
```json
{
  "message": "comfortable shoes for jogging under 4000",
  "session_id": "optional-uuid",
  "cart_items": {},
  "cart_variants": {},
  "api_key": "optional-groq-key"
}
```

**Response:**
```json
{
  "session_id": "sess_abc123",
  "text": "Found 12 matching shoes under ₹4,000...",
  "kind": "products",
  "product_ids": ["PROD0120", "PROD0455"],
  "products": [
    {
      "product_id": "PROD0120",
      "name": "NovaFit Active Running Shoes",
      "category": "Footwear",
      "subcategory": "Running Shoes",
      "brand": "NovaFit",
      "price": 4999.0,
      "discount_percent": 25.0,
      "sale_price": 3749.0,
      "rating": 4.6,
      "review_count": 240,
      "stock_quantity": 18,
      "in_stock": true,
      "sizes": ["8", "9", "10"],
      "colors": ["Black", "Blue"],
      "description": "Lightweight breathable mesh for daily running."
    }
  ],
  "followups": ["Add first to cart", "Compare top 3"],
  "cart": { "items": {}, "total_count": 0 }
}
```

---

### 3. Product Catalog & Filter Search
`GET /api/products`
Query parameters:
- `category` (string, optional)
- `subcategory` (string, optional)
- `min_price` / `max_price` (float, optional)
- `min_rating` (float, optional)
- `in_stock_only` (bool, optional)
- `sort_by` (`price_asc` | `price_desc` | `rating_desc` | `popularity_desc`)
- `page` (int, default 1)
- `page_size` (int, default 12)

---

### 4. Product Comparison
`POST /api/compare`
Compares 2 to 4 product IDs and generates an attribute matrix with highlighted winners (best price, highest rating, maximum discount).

**Request Body:**
```json
{
  "product_ids": ["PROD0001", "PROD0002"]
}
```

---

### 5. Chrome Extension Page Analyzer
`POST /api/analyze-product`
Used by the Chrome Extension to evaluate any external live product (from Amazon, Flipkart, etc.), calculate a Deal Score, and find matching alternatives from the catalog.

**Request Body:**
```json
{
  "title": "Nike Air Zoom Pegasus 40",
  "price": "₹8,495",
  "rating": "4.2",
  "review_count": "1,420",
  "reviews": ["Great cushioning", "Runs slightly narrow"]
}
```

**Response:**
```json
{
  "title": "Nike Air Zoom Pegasus 40",
  "deal_score": 84,
  "verdict": "Recommended Buy ✅",
  "pros": ["Highly rated (4.2 / 5.0) with strong customer satisfaction.", "Customers praise: comfortable, durable."],
  "cons": ["Common customer complaints: tight."],
  "alternatives": [...],
  "suggested_questions": ["Is Nike Air Zoom worth the price?", "Are there cheaper options under ₹3,000?"]
}
```
