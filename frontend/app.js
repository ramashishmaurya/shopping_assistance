/**
 * ShopMind AI — Modern Vanilla JS Application
 * Handles chat communication, RAG results rendering, client-side cart,
 * product comparison, and settings.
 */

// Application State
const state = {
  backendUrl: localStorage.getItem("shopmind_backend_url") || "http://localhost:8000",
  apiKey: localStorage.getItem("shopmind_api_key") || "",
  sessionId: localStorage.getItem("shopmind_session_id") || "sess_" + Math.random().toString(36).substring(2, 9),
  cart: JSON.parse(localStorage.getItem("shopmind_cart") || '{"items": {}, "variants": {}}'),
  compareIds: JSON.parse(localStorage.getItem("shopmind_compare_ids") || '[]'),
  catalog: null,
  activePendingProduct: null,
  selectedVariant: { size: null, colour: null }
};

// DOM Elements
const el = {
  statusIndicator: document.getElementById("statusIndicator"),
  statusText: document.getElementById("statusText"),
  messagesContainer: document.getElementById("messagesContainer"),
  chatForm: document.getElementById("chatForm"),
  chatInput: document.getElementById("chatInput"),
  btnClearChat: document.getElementById("btnClearChat"),
  
  // Sidebar & Filters
  filterSidebar: document.getElementById("filterSidebar"),
  btnToggleFilters: document.getElementById("btnToggleFilters"),
  btnCloseSidebar: document.getElementById("btnCloseSidebar"),
  filterCategory: document.getElementById("filterCategory"),
  filterSubcategory: document.getElementById("filterSubcategory"),
  priceMaxSlider: document.getElementById("priceMaxSlider"),
  priceDisplay: document.getElementById("priceDisplay"),
  ratingPills: document.getElementById("ratingPills"),
  filterInStockOnly: document.getElementById("filterInStockOnly"),
  btnApplySidebarSearch: document.getElementById("btnApplySidebarSearch"),
  btnResetFilters: document.getElementById("btnResetFilters"),

  // Cart
  cartOverlay: document.getElementById("cartOverlay"),
  btnOpenCart: document.getElementById("btnOpenCart"),
  btnCloseCart: document.getElementById("btnCloseCart"),
  cartCountBadge: document.getElementById("cartCountBadge"),
  cartItemCountText: document.getElementById("cartItemCountText"),
  cartItemsList: document.getElementById("cartItemsList"),
  cartSubtotal: document.getElementById("cartSubtotal"),
  cartSavings: document.getElementById("cartSavings"),
  cartTotal: document.getElementById("cartTotal"),
  btnCheckout: document.getElementById("btnCheckout"),

  // Compare
  compareModal: document.getElementById("compareModal"),
  btnOpenCompare: document.getElementById("btnOpenCompare"),
  btnCloseCompare: document.getElementById("btnCloseCompare"),
  btnClearCompare: document.getElementById("btnClearCompare"),
  compareCountBadge: document.getElementById("compareCountBadge"),
  compareModalBody: document.getElementById("compareModalBody"),

  // Variant Modal
  variantModal: document.getElementById("variantModal"),
  variantModalTitle: document.getElementById("variantModalTitle"),
  variantSizes: document.getElementById("variantSizes"),
  variantColors: document.getElementById("variantColors"),
  btnCloseVariant: document.getElementById("btnCloseVariant"),
  btnConfirmAddToCart: document.getElementById("btnConfirmAddToCart"),

  // Settings Modal
  settingsModal: document.getElementById("settingsModal"),
  btnOpenSettings: document.getElementById("btnOpenSettings"),
  btnCloseSettings: document.getElementById("btnCloseSettings"),
  settingBackendUrl: document.getElementById("settingBackendUrl"),
  settingGroqKey: document.getElementById("settingGroqKey"),
  btnSaveSettings: document.getElementById("btnSaveSettings"),

  // Toasts
  toastContainer: document.getElementById("toastContainer")
};

// ============================================================================
// Initialization
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
  localStorage.setItem("shopmind_session_id", state.sessionId);
  updateCartBadges();
  updateCompareBadges();
  bindEvents();
  checkBackendHealth();
  loadCategories();
});

// ============================================================================
// Event Handlers & Binding
// ============================================================================
function bindEvents() {
  // Chat form submission
  el.chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = el.chatInput.value.trim();
    if (!query) return;
    sendMessage(query);
    el.chatInput.value = "";
  });

  // Prompt chips
  document.querySelectorAll(".chip-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const prompt = btn.dataset.prompt;
      if (prompt) sendMessage(prompt);
    });
  });

  // Sidebar toggle
  el.btnToggleFilters.addEventListener("click", () => el.filterSidebar.classList.toggle("open"));
  el.btnCloseSidebar.addEventListener("click", () => el.filterSidebar.classList.remove("open"));

  // Price slider
  el.priceMaxSlider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value, 10);
    el.priceDisplay.textContent = val >= 80000 ? "Any Price" : `Up to ₹${val.toLocaleString("en-IN")}`;
  });

  // Category change -> update subcategories
  el.filterCategory.addEventListener("change", () => {
    const cat = el.filterCategory.value;
    el.filterSubcategory.innerHTML = '<option value="">All Subcategories</option>';
    if (cat && state.catalog && state.catalog.categories[cat]) {
      el.filterSubcategory.disabled = false;
      state.catalog.categories[cat].subcategories.forEach((sub) => {
        const opt = document.createElement("option");
        opt.value = sub.name;
        opt.textContent = `${sub.name} (${sub.count})`;
        el.filterSubcategory.appendChild(opt);
      });
    } else {
      el.filterSubcategory.disabled = true;
    }
  });

  // Rating pills
  el.ratingPills.querySelectorAll(".pill-btn").forEach((pill) => {
    pill.addEventListener("click", () => {
      el.ratingPills.querySelectorAll(".pill-btn").forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
    });
  });

  // Apply Sidebar search
  el.btnApplySidebarSearch.addEventListener("click", () => {
    const cat = el.filterCategory.value;
    const sub = el.filterSubcategory.value;
    const maxPrice = parseInt(el.priceMaxSlider.value, 10);
    const activeRating = parseFloat(el.ratingPills.querySelector(".pill-btn.active").dataset.rating) || 0;

    let queryParts = [];
    if (sub) queryParts.push(sub);
    else if (cat) queryParts.push(cat);
    else queryParts.push("all products");

    if (maxPrice < 80000) queryParts.push(`under ${maxPrice}`);
    if (activeRating > 0) queryParts.push(`rated above ${activeRating}`);

    sendMessage(queryParts.join(" "));
    el.filterSidebar.classList.remove("open");
  });

  // Reset filters
  el.btnResetFilters.addEventListener("click", () => {
    el.filterCategory.value = "";
    el.filterSubcategory.value = "";
    el.filterSubcategory.disabled = true;
    el.priceMaxSlider.value = 80000;
    el.priceDisplay.textContent = "Any Price";
    el.ratingPills.querySelectorAll(".pill-btn").forEach((p, i) => p.classList.toggle("active", i === 0));
    el.filterInStockOnly.checked = true;
    showToast("Filters reset to default", "info");
  });

  // Clear chat
  el.btnClearChat.addEventListener("click", () => {
    el.messagesContainer.querySelectorAll(".message-card:not(.welcome-hero)").forEach((m) => m.remove());
    showToast("Chat cleared", "info");
  });

  // Cart Drawer
  el.btnOpenCart.addEventListener("click", () => {
    renderCartDrawer();
    el.cartOverlay.classList.add("active");
  });
  el.btnCloseCart.addEventListener("click", () => el.cartOverlay.classList.remove("active"));
  el.cartOverlay.addEventListener("click", (e) => {
    if (e.target === el.cartOverlay) el.cartOverlay.classList.remove("active");
  });

  // Checkout button
  el.btnCheckout.addEventListener("click", () => {
    if (Object.keys(state.cart.items).length === 0) {
      showToast("Your cart is empty!", "warning");
      return;
    }
    showToast("🎉 Order placed successfully! Thank you for shopping with us.", "success");
    state.cart = { items: {}, variants: {} };
    saveCart();
    renderCartDrawer();
    el.cartOverlay.classList.remove("active");
  });

  // Compare Modal
  el.btnOpenCompare.addEventListener("click", openCompareModal);
  el.btnCloseCompare.addEventListener("click", () => el.compareModal.classList.remove("active"));
  el.btnClearCompare.addEventListener("click", () => {
    state.compareIds = [];
    saveCompare();
    el.compareModal.classList.remove("active");
    showToast("Comparison cleared", "info");
  });

  // Variant Modal
  el.btnCloseVariant.addEventListener("click", () => el.variantModal.classList.remove("active"));
  el.btnConfirmAddToCart.addEventListener("click", handleConfirmVariantAddToCart);

  // Settings Modal
  el.btnOpenSettings.addEventListener("click", () => {
    el.settingBackendUrl.value = state.backendUrl;
    el.settingGroqKey.value = state.apiKey;
    el.settingsModal.classList.add("active");
  });
  el.btnCloseSettings.addEventListener("click", () => el.settingsModal.classList.remove("active"));
  el.btnSaveSettings.addEventListener("click", () => {
    let url = el.settingBackendUrl.value.trim().replace(/\/$/, "");
    if (!url) url = "http://localhost:8000";
    state.backendUrl = url;
    state.apiKey = el.settingGroqKey.value.trim();
    localStorage.setItem("shopmind_backend_url", state.backendUrl);
    localStorage.setItem("shopmind_api_key", state.apiKey);
    el.settingsModal.classList.remove("active");
    showToast("Settings saved!", "success");
    checkBackendHealth();
    loadCategories();
  });
}

// ============================================================================
// Backend Communication & API
// ============================================================================
async function checkBackendHealth() {
  el.statusText.textContent = "Connecting…";
  try {
    const res = await fetch(`${state.backendUrl}/api/health`, { method: "GET" });
    if (res.ok) {
      const data = await res.json();
      el.statusIndicator.className = "status-indicator online";
      el.statusText.textContent = `Online · ${data.products_count} Products`;
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (err) {
    el.statusIndicator.className = "status-indicator offline";
    el.statusText.textContent = "Offline (Click ⚙️ to set Backend URL)";
  }
}

async function loadCategories() {
  try {
    const res = await fetch(`${state.backendUrl}/api/categories`);
    if (!res.ok) return;
    const data = await res.json();
    state.catalog = data;

    el.filterCategory.innerHTML = '<option value="">All Categories</option>';
    Object.keys(data.categories).forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = `${cat} (${data.categories[cat].count})`;
      el.filterCategory.appendChild(opt);
    });
  } catch (err) {
    console.warn("Could not load categories", err);
  }
}

// ============================================================================
// Messaging & Chat View
// ============================================================================
async function sendMessage(text) {
  appendUserMessage(text);
  const assistantCard = appendLoadingAssistantMessage();

  try {
    const payload = {
      message: text,
      session_id: state.sessionId,
      cart_items: state.cart.items,
      cart_variants: state.cart.variants,
      api_key: state.apiKey || undefined
    };

    const res = await fetch(`${state.backendUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    if (data.session_id) {
      state.sessionId = data.session_id;
      localStorage.setItem("shopmind_session_id", state.sessionId);
    }

    renderAssistantResponse(assistantCard, data);
  } catch (err) {
    console.error("Chat error:", err);
    assistantCard.querySelector(".msg-content").innerHTML = `
      <p style="color: var(--danger)">⚠️ Could not connect to the backend server (${err.message}).</p>
      <p style="font-size: 0.82rem; margin-top: 0.4rem; color: var(--text-muted)">
        Make sure the backend is running at <code>${state.backendUrl}</code> or update the URL in ⚙️ Settings.
      </p>
    `;
  }
}

function appendUserMessage(text) {
  const card = document.createElement("div");
  card.className = "message-card user";
  card.innerHTML = `
    <div class="msg-avatar">👤</div>
    <div class="msg-content"><p>${escapeHtml(text)}</p></div>
  `;
  el.messagesContainer.appendChild(card);
  scrollToBottom();
}

function appendLoadingAssistantMessage() {
  const card = document.createElement("div");
  card.className = "message-card assistant";
  card.innerHTML = `
    <div class="msg-avatar">🛍️</div>
    <div class="msg-content">
      <p style="color: var(--text-muted); display: flex; align-items: center; gap: 8px;">
        <span class="status-dot"></span> Searching catalog and verifying recommendations…
      </p>
    </div>
  `;
  el.messagesContainer.appendChild(card);
  scrollToBottom();
  return card;
}

function renderAssistantResponse(card, data) {
  const content = card.querySelector(".msg-content");
  content.innerHTML = "";

  // Main natural language summary
  if (data.text) {
    const p = document.createElement("div");
    p.innerHTML = formatMarkdown(data.text);
    content.appendChild(p);
  }

  // Matching Products
  if (data.products && data.products.length > 0) {
    const gridContainer = document.createElement("div");
    gridContainer.className = "products-grid-container";
    
    const count = data.products.length;
    gridContainer.innerHTML = `
      <div class="products-grid-header">
        <span>Showing ${count} matching product${count > 1 ? 's' : ''}</span>
      </div>
      <div class="products-carousel"></div>
    `;

    const carousel = gridContainer.querySelector(".products-carousel");
    data.products.forEach((prod) => {
      carousel.appendChild(createProductCard(prod));
    });

    content.appendChild(gridContainer);
  }

  // Follow-up suggestions
  if (data.followups && data.followups.length > 0) {
    const followupBox = document.createElement("div");
    followupBox.className = "quick-prompts";
    followupBox.style.marginTop = "0.75rem";
    followupBox.innerHTML = `
      <div class="prompt-chips">
        ${data.followups.map(f => `<button class="chip-btn" data-prompt="${escapeHtml(f)}">${escapeHtml(f)}</button>`).join('')}
      </div>
    `;
    followupBox.querySelectorAll(".chip-btn").forEach(btn => {
      btn.addEventListener("click", () => sendMessage(btn.dataset.prompt));
    });
    content.appendChild(followupBox);
  }

  scrollToBottom();
}

// ============================================================================
// Product Card Component
// ============================================================================
function createProductCard(prod) {
  const card = document.createElement("div");
  card.className = "product-card";
  card.dataset.pid = prod.product_id;

  const discount = Math.round(prod.discount_percent);
  const isComparing = state.compareIds.includes(prod.product_id);
  const inStock = prod.in_stock && prod.stock_quantity > 0;
  
  let stockBadge = '<span class="badge-stock badge-in">In stock</span>';
  if (!inStock) stockBadge = '<span class="badge-stock badge-out">Out of stock</span>';
  else if (prod.stock_quantity <= 10) stockBadge = `<span class="badge-stock badge-low">Only ${prod.stock_quantity} left</span>`;

  const stars = "★".repeat(Math.round(prod.rating)) + "☆".repeat(5 - Math.round(prod.rating));

  card.innerHTML = `
    <div class="card-top">
      <span class="card-pid">${prod.product_id}</span>
      ${stockBadge}
    </div>
    <div class="card-title">${escapeHtml(prod.name)}</div>
    <div class="card-meta">${escapeHtml(prod.brand)} · ${escapeHtml(prod.category)} › ${escapeHtml(prod.subcategory)}</div>
    <div class="price-row">
      <span class="price-sale">₹${prod.sale_price.toLocaleString("en-IN")}</span>
      ${discount > 0 ? `<span class="price-mrp">₹${prod.price.toLocaleString("en-IN")}</span>` : ''}
      ${discount > 0 ? `<span class="badge-off">${discount}% off</span>` : ''}
    </div>
    <div class="card-rating">
      <span>${stars}</span> <strong>${prod.rating.toFixed(1)}</strong> <span style="color: var(--text-subtle)">(${prod.review_count} reviews)</span>
    </div>
    <div class="card-desc">${escapeHtml(prod.description)}</div>
    <div class="card-tags">
      ${prod.sizes.map(s => `<span class="card-tag">Sz: ${escapeHtml(s)}</span>`).join('')}
      ${prod.colors.map(c => `<span class="card-tag">${escapeHtml(c)}</span>`).join('')}
    </div>
    <div class="card-actions">
      <button class="btn btn-primary btn-add-cart" ${!inStock ? 'disabled' : ''}>
        🛒 Add
      </button>
      <button class="btn btn-secondary btn-toggle-compare">
        ${isComparing ? '✓ Selected' : '⚖️ Compare'}
      </button>
    </div>
  `;

  // Attach buttons
  const btnAdd = card.querySelector(".btn-add-cart");
  if (btnAdd && inStock) {
    btnAdd.addEventListener("click", () => handleAddToCartClick(prod));
  }

  const btnCmp = card.querySelector(".btn-toggle-compare");
  btnCmp.addEventListener("click", () => {
    toggleCompare(prod.product_id);
    btnCmp.textContent = state.compareIds.includes(prod.product_id) ? '✓ Selected' : '⚖️ Compare';
  });

  return card;
}

// ============================================================================
// Cart Logic & Management
// ============================================================================
function handleAddToCartClick(prod) {
  // If product has multiple sizes or colours, prompt variant selector
  const hasMultipleSizes = prod.sizes && prod.sizes.length > 1;
  const hasMultipleColors = prod.colors && prod.colors.length > 1;

  if (hasMultipleSizes || hasMultipleColors) {
    openVariantModal(prod);
    return;
  }

  // Direct add
  const chosenSize = prod.sizes && prod.sizes.length === 1 ? prod.sizes[0] : "Standard";
  const chosenColor = prod.colors && prod.colors.length === 1 ? prod.colors[0] : "";
  addToCart(prod.product_id, 1, chosenSize, chosenColor, prod.name, prod.sale_price);
}

function openVariantModal(prod) {
  state.activePendingProduct = prod;
  state.selectedVariant = {
    size: prod.sizes && prod.sizes.length ? prod.sizes[0] : "Standard",
    colour: prod.colors && prod.colors.length ? prod.colors[0] : ""
  };

  el.variantModalTitle.textContent = `Choose Options for ${prod.name}`;

  // Render sizes
  el.variantSizes.innerHTML = "";
  prod.sizes.forEach((s) => {
    const chip = document.createElement("button");
    chip.className = `variant-chip ${s === state.selectedVariant.size ? 'selected' : ''}`;
    chip.textContent = s;
    chip.addEventListener("click", () => {
      state.selectedVariant.size = s;
      el.variantSizes.querySelectorAll(".variant-chip").forEach(c => c.classList.remove("selected"));
      chip.classList.add("selected");
    });
    el.variantSizes.appendChild(chip);
  });

  // Render colours
  el.variantColors.innerHTML = "";
  prod.colors.forEach((c) => {
    const chip = document.createElement("button");
    chip.className = `variant-chip ${c === state.selectedVariant.colour ? 'selected' : ''}`;
    chip.textContent = c;
    chip.addEventListener("click", () => {
      state.selectedVariant.colour = c;
      el.variantColors.querySelectorAll(".variant-chip").forEach(c => c.classList.remove("selected"));
      chip.classList.add("selected");
    });
    el.variantColors.appendChild(chip);
  });

  el.variantModal.classList.add("active");
}

function handleConfirmVariantAddToCart() {
  if (!state.activePendingProduct) return;
  const prod = state.activePendingProduct;
  addToCart(prod.product_id, 1, state.selectedVariant.size, state.selectedVariant.colour, prod.name, prod.sale_price);
  el.variantModal.classList.remove("active");
  state.activePendingProduct = null;
}

function addToCart(productId, qty, size, colour, name, price) {
  const current = state.cart.items[productId] || 0;
  state.cart.items[productId] = current + qty;
  state.cart.variants[productId] = {
    size: size || "Standard",
    colour: colour || "",
    name: name || productId,
    price: price || 0
  };

  saveCart();
  updateCartBadges();
  showToast(`Added ${name || productId} to cart!`, "success");
}

function updateCartBadges() {
  const total = Object.values(state.cart.items).reduce((a, b) => a + b, 0);
  el.cartCountBadge.textContent = total;
  el.cartItemCountText.textContent = `${total} item${total !== 1 ? 's' : ''}`;
}

function saveCart() {
  localStorage.setItem("shopmind_cart", JSON.stringify(state.cart));
}

async function renderCartDrawer() {
  el.cartItemsList.innerHTML = "";
  const pids = Object.keys(state.cart.items);

  if (pids.length === 0) {
    el.cartItemsList.innerHTML = `
      <div class="cart-empty">
        <p style="font-size: 2.5rem; margin-bottom: 0.5rem">🛒</p>
        <p><strong>Your cart is empty</strong></p>
        <p style="font-size: 0.8rem; margin-top: 0.2rem">Search for items in chat and add them.</p>
      </div>
    `;
    el.cartSubtotal.textContent = "₹0";
    el.cartSavings.textContent = "-₹0";
    el.cartTotal.textContent = "₹0";
    return;
  }

  let totalAmount = 0;

  for (const pid of pids) {
    const qty = state.cart.items[pid];
    const variant = state.cart.variants[pid] || {};
    const itemPrice = (variant.price || 0) * qty;
    totalAmount += itemPrice;

    const itemEl = document.createElement("div");
    itemEl.className = "cart-item-card";
    itemEl.innerHTML = `
      <div class="cart-item-top">
        <div>
          <div class="cart-item-name">${escapeHtml(variant.name || pid)}</div>
          <div class="cart-item-variant">Size: ${escapeHtml(variant.size || 'Std')} ${variant.colour ? `· ${escapeHtml(variant.colour)}` : ''}</div>
        </div>
        <div style="font-weight: 700">₹${itemPrice.toLocaleString("en-IN")}</div>
      </div>
      <div class="cart-item-controls">
        <div class="qty-stepper">
          <button class="qty-btn btn-dec">-</button>
          <span class="qty-val">${qty}</span>
          <button class="qty-btn btn-inc">+</button>
        </div>
        <button class="btn-remove-item">Remove</button>
      </div>
    `;

    itemEl.querySelector(".btn-dec").addEventListener("click", () => {
      if (state.cart.items[pid] > 1) {
        state.cart.items[pid] -= 1;
      } else {
        delete state.cart.items[pid];
        delete state.cart.variants[pid];
      }
      saveCart();
      updateCartBadges();
      renderCartDrawer();
    });

    itemEl.querySelector(".btn-inc").addEventListener("click", () => {
      state.cart.items[pid] += 1;
      saveCart();
      updateCartBadges();
      renderCartDrawer();
    });

    itemEl.querySelector(".btn-remove-item").addEventListener("click", () => {
      delete state.cart.items[pid];
      delete state.cart.variants[pid];
      saveCart();
      updateCartBadges();
      renderCartDrawer();
    });

    el.cartItemsList.appendChild(itemEl);
  }

  el.cartSubtotal.textContent = `₹${totalAmount.toLocaleString("en-IN")}`;
  el.cartSavings.textContent = "-₹0";
  el.cartTotal.textContent = `₹${totalAmount.toLocaleString("en-IN")}`;
}

// ============================================================================
// Comparison Logic
// ============================================================================
function toggleCompare(pid) {
  if (state.compareIds.includes(pid)) {
    state.compareIds = state.compareIds.filter(id => id !== pid);
    showToast(`Removed from comparison`, "info");
  } else {
    if (state.compareIds.length >= 4) {
      showToast("You can compare up to 4 products at a time.", "warning");
      return;
    }
    state.compareIds.push(pid);
    showToast(`Added to comparison`, "success");
  }
  saveCompare();
  updateCompareBadges();
}

function updateCompareBadges() {
  el.compareCountBadge.textContent = state.compareIds.length;
}

function saveCompare() {
  localStorage.setItem("shopmind_compare_ids", JSON.stringify(state.compareIds));
}

async function openCompareModal() {
  if (state.compareIds.length < 2) {
    showToast("Please select at least 2 products to compare.", "warning");
    return;
  }

  el.compareModalBody.innerHTML = '<p style="text-align: center; padding: 2rem">Loading comparison…</p>';
  el.compareModal.classList.add("active");

  try {
    const res = await fetch(`${state.backendUrl}/api/compare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_ids: state.compareIds })
    });

    if (!res.ok) throw new Error("Could not fetch comparison");
    const data = await res.json();
    renderComparisonTable(data.comparison_table);
  } catch (err) {
    el.compareModalBody.innerHTML = `<p style="color: var(--danger)">Error: ${err.message}</p>`;
  }
}

function renderComparisonTable(tableData) {
  const products = Object.keys(tableData);
  if (products.length === 0) return;

  const attributes = Object.keys(tableData[products[0]]);

  let html = '<table class="compare-table"><thead><tr><th>Attribute</th>';
  products.forEach(p => {
    html += `<th>${escapeHtml(p)}</th>`;
  });
  html += '</tr></thead><tbody>';

  attributes.forEach(attr => {
    html += `<tr><th>${escapeHtml(attr)}</th>`;
    products.forEach(p => {
      html += `<td>${escapeHtml(String(tableData[p][attr]))}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table>';
  el.compareModalBody.innerHTML = html;
}

// ============================================================================
// Utilities
// ============================================================================
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = "toast";
  let icon = "ℹ️";
  if (type === "success") icon = "✅";
  if (type === "warning") icon = "⚠️";
  if (type === "danger") icon = "❌";

  toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;
  el.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function scrollToBottom() {
  setTimeout(() => {
    el.messagesContainer.scrollTop = el.messagesContainer.scrollHeight;
  }, 50);
}

function escapeHtml(text) {
  if (typeof text !== "string") return text;
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMarkdown(text) {
  let html = escapeHtml(text);
  // Bold **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic *text*
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Newlines to <br>
  html = html.replace(/\n\n/g, '<p style="margin-bottom: 0.5rem"></p>');
  html = html.replace(/\n/g, '<br>');
  return html;
}
