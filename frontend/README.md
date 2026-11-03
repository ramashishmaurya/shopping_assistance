# ShopMind AI — React + Vite Frontend 🛍️✨

Modern, high-performance React frontend for the **AI Shopping Assistant**, featuring deep obsidian glassmorphic styling, responsive layout, dark/light theme switching, grounded catalog browsing, side-by-side product comparisons, and seamless shopping cart management.

---

## 🚀 Key Features

- **⚡ Vite + React 19 Engine**: Instant Hot Module Replacement (HMR) and optimized sub-second production builds.
- **🎨 Obsidian Glow & Apple Slate Themes**: Built-in toggle between dark mode (Deep Obsidian Glow) and light mode (Frosted Apple Slate).
- **🤖 Grounded AI Assistant**: Conversational product advisor backed by FAISS vector embeddings and real-time catalog filtering.
- **📱 Responsive Drawer & Modals**:
  - **Cart Drawer**: Persistent shopping cart with quantity stepper, subtotal, and checkout flow.
  - **Compare Modal**: Side-by-side matrix comparing up to 4 products with best-price and top-rating winner badges.
  - **Variant Modal**: Interactive size and color selector.
  - **Settings Modal**: Configure FastAPI backend URL (localhost or cloud) and LLM inference keys.
- **🔎 Dynamic Filter Sidebar**: Filter products by category, subcategory, budget slider, and minimum rating.
- **🍞 Floating Toasts**: Animated micro-notifications for instant visual feedback.

---

## 🛠️ Local Development

### Prerequisites
- Node.js 18+ (tested with Node v24)
- Python 3.11+ running the backend on port 8000

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start Vite Dev Server
```bash
npm run dev
```
The frontend will start at `http://localhost:5173`. It connects automatically to the FastAPI backend running at `http://127.0.0.1:8000`.

### 3. Production Build
```bash
npm run build
```
Creates an optimized static bundle in `frontend/dist/`.

---

## ☁️ Deployment on Vercel

1. Push this repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com/new), import your repository.
3. Configure the Project Settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click **Deploy**!
5. In the deployed frontend, open the **Settings** gear icon in the top header and enter your deployed backend URL (e.g. `https://your-shopping-assistant.onrender.com`).

---

## 📁 Component Structure

```
frontend/
├── index.html                  # HTML entry point with Google Fonts (Outfit & Inter)
├── package.json                # Project dependencies (lucide-react, react, vite)
├── vercel.json                 # Vercel SPA rewrite rules
├── src/
│   ├── main.jsx                # Application root mounting
│   ├── index.css               # Comprehensive theme system & tokens (dark/light)
│   ├── App.jsx                 # Main state coordinator & view manager
│   └── components/
│       ├── Header.jsx          # Top navbar, brand logo, status indicator, counters
│       ├── FilterSidebar.jsx   # Catalog filter controls (category, budget, rating)
│       ├── ProductCard.jsx     # Product card with price, stock badges, rating
│       ├── ChatArea.jsx        # AI chat console, quick prompts, inline carousel
│       ├── CartDrawer.jsx      # Slide-out shopping cart drawer
│       ├── CompareModal.jsx    # Side-by-side product comparison modal
│       ├── VariantModal.jsx    # Size & color picker modal
│       ├── SettingsModal.jsx   # API backend URL & LLM key switcher
│       └── Toast.jsx           # Animated floating feedback pills
└── dist/                       # Compiled production bundle
```
