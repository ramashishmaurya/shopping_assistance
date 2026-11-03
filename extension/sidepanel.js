// ShopMind AI — Sidepanel Logic

let backendUrl = "http://127.0.0.1:8000";
let apiKey = "";
let currentProduct = null;

// DOM Elements
const el = {
  backendStatus: document.getElementById("backendStatus"),
  btnRefresh: document.getElementById("btnRefresh"),
  btnSettings: document.getElementById("btnSettings"),
  
  productStoreBadge: document.getElementById("productStoreBadge"),
  productTitle: document.getElementById("productTitle"),
  productPrice: document.getElementById("productPrice"),
  productRating: document.getElementById("productRating"),
  
  verdictSection: document.getElementById("verdictSection"),
  scoreValue: document.getElementById("scoreValue"),
  verdictTag: document.getElementById("verdictTag"),
  prosList: document.getElementById("prosList"),
  consList: document.getElementById("consList"),
  
  alternativesSection: document.getElementById("alternativesSection"),
  alternativesList: document.getElementById("alternativesList"),
  alternativesCount: document.getElementById("alternativesCount"),
  
  suggestedQuestions: document.getElementById("suggestedQuestions"),
  chatHistory: document.getElementById("chatHistory"),
  chatForm: document.getElementById("chatForm"),
  chatInput: document.getElementById("chatInput"),
  
  settingsDrawer: document.getElementById("settingsDrawer"),
  btnCloseSettings: document.getElementById("btnCloseSettings"),
  settingBackendUrl: document.getElementById("backendUrl"),
  settingGroqKey: document.getElementById("groqKey"),
  btnSaveSettings: document.getElementById("btnSaveSettings")
};

document.addEventListener("DOMContentLoaded", async () => {
  // Load saved settings
  const stored = await chrome.storage.local.get(["backendUrl", "apiKey"]);
  if (stored.backendUrl) backendUrl = stored.backendUrl;
  if (stored.apiKey) apiKey = stored.apiKey;
  
  el.settingBackendUrl.value = backendUrl;
  el.settingGroqKey.value = apiKey;

  bindEvents();
  checkBackend();
  scanActiveTab();
});

function bindEvents() {
  el.btnRefresh.addEventListener("click", () => scanActiveTab());
  
  el.btnSettings.addEventListener("click", () => el.settingsDrawer.classList.add("open"));
  el.btnCloseSettings.addEventListener("click", () => el.settingsDrawer.classList.remove("open"));
  
  el.btnSaveSettings.addEventListener("click", async () => {
    let url = el.settingBackendUrl.value.trim().replace(/\/$/, "");
    if (!url) url = "http://127.0.0.1:8000";
    backendUrl = url;
    apiKey = el.settingGroqKey.value.trim();
    
    await chrome.storage.local.set({ backendUrl, apiKey });
    el.settingsDrawer.classList.remove("open");
    checkBackend();
    scanActiveTab();
  });

  el.chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = el.chatInput.value.trim();
    if (!query) return;
    handleChat(query);
    el.chatInput.value = "";
  });
}

async function checkBackend() {
  try {
    const res = await fetch(`${backendUrl}/api/health`);
    if (res.ok) {
      el.backendStatus.textContent = "Online · Ready";
      el.backendStatus.style.color = "var(--success)";
    } else {
      throw new Error();
    }
  } catch (err) {
    el.backendStatus.textContent = "Offline (Check ⚙️)";
    el.backendStatus.style.color = "var(--warning)";
  }
}

async function scanActiveTab() {
  el.productStoreBadge.textContent = "Scanning active tab…";
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      el.productTitle.textContent = "Could not access tab.";
      return;
    }

    chrome.tabs.sendMessage(tab.id, { action: "GET_PRODUCT_DETAILS" }, (response) => {
      if (chrome.runtime.lastError || !response || !response.title) {
        el.productStoreBadge.textContent = "No Product Detected";
        el.productTitle.textContent = "Open any Amazon, Flipkart, or e-commerce product page.";
        el.productPrice.textContent = "--";
        el.productRating.textContent = "--";
        el.verdictSection.style.display = "none";
        el.alternativesSection.style.display = "none";
        return;
      }

      currentProduct = response;
      displayProduct(response);
      analyzeWithBackend(response);
    });
  } catch (err) {
    console.error("Scan error:", err);
  }
}

function displayProduct(p) {
  el.productStoreBadge.textContent = p.hostname.replace("www.", "").toUpperCase();
  el.productTitle.textContent = p.title;
  el.productPrice.textContent = p.price;
  el.productRating.textContent = p.rating ? `★ ${p.rating} ${p.reviewCount ? `(${p.reviewCount})` : ''}` : '';
}

async function analyzeWithBackend(p) {
  try {
    const res = await fetch(`${backendUrl}/api/analyze-product`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: p.title,
        price: p.price,
        rating: p.rating,
        review_count: p.reviewCount,
        description: p.description,
        reviews: p.reviews,
        url: p.url,
        api_key: apiKey || undefined
      })
    });

    if (!res.ok) throw new Error("Backend analysis error");
    const data = await res.json();
    renderAnalysis(data);
  } catch (err) {
    console.warn("Could not analyze with backend:", err);
  }
}

function renderAnalysis(data) {
  // Score & Verdict
  el.scoreValue.textContent = data.deal_score;
  el.verdictTag.textContent = data.verdict;
  
  // Pros
  el.prosList.innerHTML = "";
  data.pros.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    el.prosList.appendChild(li);
  });

  // Cons
  el.consList.innerHTML = "";
  data.cons.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    el.consList.appendChild(li);
  });

  el.verdictSection.style.display = "block";

  // Catalog Alternatives
  if (data.alternatives && data.alternatives.length > 0) {
    el.alternativesList.innerHTML = "";
    el.alternativesCount.textContent = `${data.alternatives.length} catalog hits`;

    data.alternatives.forEach(alt => {
      const card = document.createElement("div");
      card.className = "alt-card";
      card.innerHTML = `
        <div class="alt-title">${escapeHtml(alt.name)}</div>
        <div class="alt-price">₹${alt.sale_price.toLocaleString("en-IN")}</div>
        <div class="alt-meta">★ ${alt.rating.toFixed(1)} · ${escapeHtml(alt.brand)}</div>
      `;
      card.addEventListener("click", () => {
        handleChat(`Tell me more about ${alt.name} (PROD ID: ${alt.product_id})`);
      });
      el.alternativesList.appendChild(card);
    });

    el.alternativesSection.style.display = "block";
  }

  // Suggested questions
  if (data.suggested_questions) {
    el.suggestedQuestions.innerHTML = "";
    data.suggested_questions.forEach(q => {
      const chip = document.createElement("button");
      chip.className = "sq-chip";
      chip.textContent = q;
      chip.addEventListener("click", () => handleChat(q));
      el.suggestedQuestions.appendChild(chip);
    });
  }
}

async function handleChat(query) {
  appendBubble("user", query);
  const loadingBubble = appendBubble("assistant", "Thinking…");

  try {
    const contextPrefix = currentProduct ? `[Currently viewing: ${currentProduct.title} (${currentProduct.price})] ` : "";
    const res = await fetch(`${backendUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: contextPrefix + query,
        api_key: apiKey || undefined
      })
    });

    if (!res.ok) throw new Error("Chat request failed");
    const data = await res.json();
    loadingBubble.innerHTML = formatMarkdown(data.text);
  } catch (err) {
    loadingBubble.innerHTML = `<span style="color: var(--danger)">⚠️ Error contacting AI: ${err.message}</span>`;
  }
}

function appendBubble(role, text) {
  const b = document.createElement("div");
  b.className = `chat-bubble ${role}`;
  b.innerHTML = escapeHtml(text);
  el.chatHistory.appendChild(b);
  el.chatHistory.scrollTop = el.chatHistory.scrollHeight;
  return b;
}

function escapeHtml(text) {
  if (typeof text !== "string") return text;
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatMarkdown(text) {
  let html = escapeHtml(text);
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\n/g, '<br>');
  return html;
}
