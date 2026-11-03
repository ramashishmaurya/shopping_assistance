# 🛍️ ShopMind AI — Chrome Extension (Manifest V3)

AI-powered shopping copilot and review analyzer extension for Google Chrome. Works natively on **Amazon, Flipkart, Myntra, and major e-commerce platforms** via Chrome's modern Side Panel API.

---

## 🌟 Key Capabilities
1. **Zero-Click Product Detection:** Automatically parses Title, Price, Rating, Customer Reviews, and Specifications from the active shopping tab.
2. **AI Deal Score & Verdict:** Evaluates whether the product is worth buying on a scale of 0 to 100.
3. **Sentiment Analysis (Pros & Cons):** Distills hundreds of customer reviews into concise, honest bullet points.
4. **Catalog Alternatives:** Uses FAISS vector similarity to find matching products from the catalog.
5. **Context-Aware Chat:** Shoppers can ask specific questions about the active product (e.g. *"Is this shoe good for marathons?"*).

---

## 📂 File Structure
```text
extension/
├── manifest.json       # Chrome Manifest V3 configuration (permissions, host permissions, side panel)
├── background.js       # Background service worker handling side panel activation
├── content.js          # Universal content script extracting Amazon/Flipkart/OpenGraph DOM details
├── sidepanel.html      # Side panel layout
├── sidepanel.css       # Midnight dark theme matching the web design system
├── sidepanel.js        # Controller fetching page data, calling backend, rendering UI
└── icons/              # Extension icons (16px, 48px, 128px)
```

---

## 🛠️ Installation in Google Chrome (30 Seconds)

1. Open Google Chrome and enter `chrome://extensions` in the address bar.
2. In the top-right corner, turn **ON** the **Developer mode** toggle.
3. Click the **Load unpacked** button in the top-left corner.
4. Select the `extension` folder inside this repository:
   ```text
   E:\vish-task-shopping-assistant\extension
   ```
5. **ShopMind AI** is now installed! Pin it to your Chrome toolbar.

---

## 🎯 How to Use
1. Ensure the FastAPI backend is running (`uvicorn backend.main:app --port 8000` or Render hosted URL).
2. Open any product page on Amazon or Flipkart (e.g. shoes, laptop, headphones).
3. Click the **ShopMind AI** icon in your toolbar.
4. The AI Side Panel opens on the right side with immediate product insights, deal score, pros/cons, and alternatives!
