import React from "react";
import { ShoppingBag, Sun, Moon, Scale, SlidersHorizontal, Settings, ShoppingCart } from "lucide-react";

export default function Header({
  theme,
  onToggleTheme,
  backendStatus,
  cartCount,
  compareCount,
  onOpenCart,
  onOpenCompare,
  onOpenSettings,
  onToggleSidebar
}) {
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="brand-section">
          <div className="brand-logo">
            <ShoppingBag size={24} />
          </div>
          <div className="brand-info">
            <h1 className="brand-title">Shop<span>Mind</span> AI</h1>
            <span className="brand-tagline">Grounded Catalog Assistant</span>
          </div>
        </div>

        <div className="header-status">
          <div className={`status-indicator ${backendStatus.online ? "online" : "offline"}`} title="Backend Connection Status">
            <span className="status-dot"></span>
            <span className="status-text">{backendStatus.text}</span>
          </div>
        </div>

        <div className="header-actions">
          <button className="nav-btn" onClick={onToggleSidebar} aria-label="Toggle Filters">
            <SlidersHorizontal size={16} />
            <span className="btn-label">Catalog</span>
          </button>
          
          <button className="nav-btn" onClick={onOpenCompare} aria-label="Open Compare Modal">
            <Scale size={16} />
            <span className="btn-label">Compare</span>
            <span className="badge">{compareCount}</span>
          </button>

          <button className="nav-btn cart-btn" onClick={onOpenCart} aria-label="Open Cart Drawer">
            <ShoppingCart size={16} />
            <span className="btn-label">Cart</span>
            <span className="badge">{cartCount}</span>
          </button>

          <button className="nav-btn icon-only theme-btn" onClick={onToggleTheme} title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}>
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button className="nav-btn icon-only" onClick={onOpenSettings} title="API Settings">
            <Settings size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
