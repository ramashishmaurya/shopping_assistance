# ✨ ShopMind AI — Frontend (Vercel Ready)

Modern, ultra-fast single page web application built with **Vanilla HTML5, modern CSS3, and ES6+ JavaScript**. Designed for 0s cold start and global CDN caching on Vercel.

---

## 🎨 Design System & Aesthetics
- **Color Palette:** Deep Midnight `#090D16`, Surface `#111827`, Accent Violet `#7C3AED` to Pink `#EC4899`, Emerald Green `#10B981` (in-stock)
- **Typography:** Google Fonts [Outfit](https://fonts.google.com/specimen/Outfit) (headers) & [Inter](https://fonts.google.com/specimen/Inter) (body)
- **Styling:** Glassmorphism (`backdrop-filter: blur`), subtle glow shadows, pulse badges, and micro-interactions
- **Responsiveness:** Desktop split layout, auto-collapsing filter drawer on mobile/tablet (< 900px), swipe-friendly cards

---

## 📂 File Architecture
```text
frontend/
├── index.html        # Semantic HTML5 document (SEO tags, accessibility attributes)
├── style.css         # Vanilla CSS design system with CSS custom properties (variables)
├── app.js            # State store, REST API clients, localStorage cart, chat & modals
└── vercel.json       # Vercel deployment headers & clean URL rules
```

---

## 🚀 Deployment on Vercel (10 Seconds)

1. Go to [vercel.com/new](https://vercel.com/new) and import this GitHub repository (`ramashishmaurya/shopping_assistance`).
2. In the setup screen, click **Edit** next to **Root Directory** and select `frontend`.
3. Click **Deploy**.
4. Once live, open the app, click the **⚙️ Settings** icon in the header, and paste your hosted backend URL (e.g. `https://shopping-assistance.onrender.com`).

---

## 🛒 Features
- **Persistent Cart:** Stored in browser `localStorage`; items, quantities, and selected sizes/colors survive page reloads.
- **Dynamic Prompts:** Pre-configured query chips for fast 1-click searches.
- **Product Badges:** In-stock (Green), Low-stock (Amber), Out-of-stock (Red), Discount % tags.
- **Spec Comparison Modal:** Select multiple products and view a side-by-side comparison table.
