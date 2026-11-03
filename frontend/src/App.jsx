import React, { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import FilterSidebar from "./components/FilterSidebar";
import ChatArea from "./components/ChatArea";
import CartDrawer from "./components/CartDrawer";
import CompareModal from "./components/CompareModal";
import VariantModal from "./components/VariantModal";
import SettingsModal from "./components/SettingsModal";
import Toast from "./components/Toast";

export default function App() {
  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("shopmind_theme") || "dark";
  });

  // Settings state
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("shopmind_settings");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      apiUrl: "http://127.0.0.1:8000",
      llmMode: "free",
      groqKey: ""
    };
  });

  // Backend connection status
  const [backendStatus, setBackendStatus] = useState({
    online: false,
    text: "Connecting..."
  });

  // Catalog metadata & products
  const [catalog, setCatalog] = useState(null);
  const [allProductsMap, setAllProductsMap] = useState({});

  // Chat conversation
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(() => "session_" + Math.random().toString(36).substring(2, 9));
  const [isThinking, setIsThinking] = useState(false);

  // Cart state: { items: { [pid]: qty }, variants: { [pid]: { name, price, size, colour } } }
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("shopmind_cart");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { items: {}, variants: {} };
  });

  // Compare state: array of product_ids (max 4)
  const [compareList, setCompareList] = useState([]);

  // UI Modals & Drawers
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [variantModalProduct, setVariantModalProduct] = useState(null);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  // Sync theme with DOM
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("shopmind_theme", theme);
  }, [theme]);

  // Sync cart with localStorage
  useEffect(() => {
    localStorage.setItem("shopmind_cart", JSON.stringify(cart));
  }, [cart]);

  // Sync settings with localStorage
  useEffect(() => {
    localStorage.setItem("shopmind_settings", JSON.stringify(settings));
  }, [settings]);

  // Check backend health & fetch categories on mount or apiUrl change
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(`${settings.apiUrl}/api/health`);
        if (res.ok) {
          const data = await res.json();
          setBackendStatus({
            online: true,
            text: `Connected (${data.products_count} Items)`
          });
        } else {
          setBackendStatus({ online: false, text: "API Error" });
        }
      } catch (err) {
        setBackendStatus({ online: false, text: "Offline (FastAPI 8000)" });
      }
    };

    const fetchCategories = async () => {
      try {
        const res = await fetch(`${settings.apiUrl}/api/categories`);
        if (res.ok) {
          const data = await res.json();
          setCatalog(data);
        }
      } catch (err) {
        console.error("Failed to fetch catalog categories", err);
      }
    };

    checkBackend();
    fetchCategories();

    // Health check polling every 25 seconds
    const interval = setInterval(checkBackend, 25000);
    return () => clearInterval(interval);
  }, [settings.apiUrl]);

  // Toggle Theme
  const handleToggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Add products to local map cache
  const cacheProducts = (newProducts) => {
    if (!newProducts || !Array.isArray(newProducts)) return;
    setAllProductsMap((prev) => {
      const updated = { ...prev };
      newProducts.forEach((p) => {
        if (p && p.product_id) {
          updated[p.product_id] = p;
        }
      });
      return updated;
    });
  };

  // Chat Send Message
  const handleSendMessage = async (text) => {
    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const payload = {
        message: text,
        session_id: sessionId,
        cart_items: cart.items,
        cart_variants: cart.variants,
        llm_mode: settings.llmMode === "groq" ? "Groq (Llama 3)" : "Free (Groq)",
        api_key: settings.groqKey || null
      };

      const res = await fetch(`${settings.apiUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();

      // Cache returned products
      if (data.products && data.products.length > 0) {
        cacheProducts(data.products);
      }

      // Check if backend returned cart updates
      if (data.cart && data.cart.items) {
        setCart({
          items: data.cart.items,
          variants: data.cart.variants || cart.variants
        });
      }

      const assistantMsg = {
        role: "assistant",
        content: data.text || "Here are the top matches from our catalog.",
        products: data.products || []
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      showToast("Could not reach backend API. Check settings.", "error");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ **Connection Error**: Unable to contact backend at \`${settings.apiUrl}\`.\n\nPlease verify that your FastAPI backend is running on port 8000 (\`uvicorn backend.main:app\`), or configure the server URL in Settings.`
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  // Clear Chat History
  const handleClearChat = () => {
    setMessages([]);
    setSessionId("session_" + Math.random().toString(36).substring(2, 9));
    showToast("Chat history cleared", "info");
  };

  // Add To Cart Trigger
  const handleAddToCart = (product) => {
    const hasOptions = (product.sizes && product.sizes.length > 1) || 
                       (product.colors && product.colors.length > 1);

    if (hasOptions) {
      setVariantModalProduct(product);
    } else {
      confirmAddToCart(
        product,
        product.sizes?.[0] || "Standard",
        product.colors?.[0] || "Standard"
      );
    }
  };

  // Confirm Add To Cart
  const confirmAddToCart = (product, size, color) => {
    const pid = product.product_id;
    setCart((prev) => {
      const newItems = { ...prev.items };
      newItems[pid] = (newItems[pid] || 0) + 1;

      const newVariants = { ...prev.variants };
      newVariants[pid] = {
        name: product.name,
        price: product.sale_price,
        size: size,
        colour: color
      };

      return { items: newItems, variants: newVariants };
    });

    cacheProducts([product]);
    showToast(`Added "${product.name.slice(0, 24)}..." to cart! 🛍️`);
  };

  // Update Cart Quantity
  const handleUpdateCartQty = (pid, delta) => {
    setCart((prev) => {
      const newItems = { ...prev.items };
      const current = newItems[pid] || 0;
      const next = current + delta;

      if (next <= 0) {
        delete newItems[pid];
        const newVariants = { ...prev.variants };
        delete newVariants[pid];
        return { items: newItems, variants: newVariants };
      } else {
        newItems[pid] = next;
        return { items: newItems, variants: prev.variants };
      }
    });
  };

  // Remove Cart Item
  const handleRemoveCartItem = (pid) => {
    setCart((prev) => {
      const newItems = { ...prev.items };
      const newVariants = { ...prev.variants };
      delete newItems[pid];
      delete newVariants[pid];
      return { items: newItems, variants: newVariants };
    });
    showToast("Item removed from cart", "info");
  };

  // Checkout
  const handleCheckout = () => {
    const totalCount = Object.values(cart.items).reduce((a, b) => a + b, 0);
    showToast(`Order Placed! Thank you for purchasing ${totalCount} items. 🎉`);
    setCart({ items: {}, variants: {} });
    setIsCartOpen(false);
  };

  // Toggle Compare
  const handleToggleCompare = (productId) => {
    setCompareList((prev) => {
      if (prev.includes(productId)) {
        showToast("Removed from comparison", "info");
        return prev.filter((id) => id !== productId);
      } else {
        if (prev.length >= 4) {
          showToast("Maximum 4 products can be compared", "error");
          return prev;
        }
        showToast("Added to compare matrix! ⚖️");
        return [...prev, productId];
      }
    });
  };

  // Remove from compare list
  const handleRemoveCompare = (productId) => {
    setCompareList((prev) => prev.filter((id) => id !== productId));
  };

  // Fetch product for compare list if missing in allProductsMap
  useEffect(() => {
    const fetchMissing = async () => {
      const missingIds = compareList.filter((id) => !allProductsMap[id]);
      if (missingIds.length === 0) return;

      for (const id of missingIds) {
        try {
          const res = await fetch(`${settings.apiUrl}/api/products/${id}`);
          if (res.ok) {
            const data = await res.json();
            cacheProducts([data]);
          }
        } catch (e) {
          console.error("Failed to fetch product for comparison", id);
        }
      }
    };

    if (compareList.length > 0) {
      fetchMissing();
    }
  }, [compareList, settings.apiUrl]);

  const compareProducts = compareList
    .map((id) => allProductsMap[id])
    .filter(Boolean);

  const cartCount = Object.values(cart.items).reduce((a, b) => a + b, 0);

  return (
    <>
      <Header
        theme={theme}
        onToggleTheme={handleToggleTheme}
        backendStatus={backendStatus}
        cartCount={cartCount}
        compareCount={compareList.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenCompare={() => setIsCompareOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      <main className="app-layout">
        <FilterSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          catalog={catalog}
          onApplySearch={handleSendMessage}
          showToast={showToast}
        />

        <ChatArea
          messages={messages}
          isThinking={isThinking}
          onSendMessage={handleSendMessage}
          onClearChat={handleClearChat}
          onAddToCart={handleAddToCart}
          onToggleCompare={handleToggleCompare}
          compareList={compareList}
        />
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={handleCheckout}
      />

      {/* Compare Modal */}
      <CompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        compareProducts={compareProducts}
        onRemoveProduct={handleRemoveCompare}
        onAddToCart={handleAddToCart}
      />

      {/* Variant Selection Modal */}
      <VariantModal
        isOpen={Boolean(variantModalProduct)}
        onClose={() => setVariantModalProduct(null)}
        product={variantModalProduct}
        onConfirm={confirmAddToCart}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings);
          showToast("Settings saved successfully! ⚙️");
        }}
      />

      {/* Toast Notifications */}
      <Toast toasts={toasts} />
    </>
  );
}
