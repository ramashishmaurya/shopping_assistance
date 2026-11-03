import React, { useState } from "react";
import { X, Search, RotateCcw } from "lucide-react";

export default function FilterSidebar({
  isOpen,
  onClose,
  catalog,
  onApplySearch,
  showToast
}) {
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [maxPrice, setMaxPrice] = useState(80000);
  const [rating, setRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(true);

  const subcategories = category && catalog?.categories[category] 
    ? catalog.categories[category].subcategories 
    : [];

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setSubcategory("");
  };

  const handleApply = () => {
    let parts = [];
    if (subcategory) parts.push(subcategory);
    else if (category) parts.push(category);
    else parts.push("all products");

    if (maxPrice < 80000) parts.push(`under ${maxPrice}`);
    if (rating > 0) parts.push(`rated above ${rating}`);

    onApplySearch(parts.join(" "));
    onClose();
  };

  const handleReset = () => {
    setCategory("");
    setSubcategory("");
    setMaxPrice(80000);
    setRating(0);
    setInStockOnly(true);
    showToast("Filters reset to default", "info");
  };

  return (
    <aside className={`filter-sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <h3>🔎 Catalog Filters</h3>
        <button className="icon-close" onClick={onClose} aria-label="Close Sidebar">
          <X size={20} />
        </button>
      </div>

      <div className="filter-section">
        <label htmlFor="filterCategory">Category</label>
        <select 
          id="filterCategory" 
          className="form-select" 
          value={category} 
          onChange={handleCategoryChange}
        >
          <option value="">All Categories</option>
          {catalog && Object.keys(catalog.categories).map((cat) => (
            <option key={cat} value={cat}>
              {cat} ({catalog.categories[cat].count})
            </option>
          ))}
        </select>
      </div>

      <div className="filter-section">
        <label htmlFor="filterSubcategory">Subcategory</label>
        <select 
          id="filterSubcategory" 
          className="form-select" 
          value={subcategory} 
          onChange={(e) => setSubcategory(e.target.value)}
          disabled={!category}
        >
          <option value="">All Subcategories</option>
          {subcategories.map((sub) => (
            <option key={sub.name} value={sub.name}>
              {sub.name} ({sub.count})
            </option>
          ))}
        </select>
      </div>

      <div className="filter-section">
        <div className="range-header">
          <label htmlFor="priceMaxSlider">Budget Cap (₹)</label>
          <span className="range-val">
            {maxPrice >= 80000 ? "Any Price" : `Up to ₹${maxPrice.toLocaleString("en-IN")}`}
          </span>
        </div>
        <input 
          type="range" 
          id="priceMaxSlider" 
          min="0" 
          max="80000" 
          step="500" 
          value={maxPrice} 
          onChange={(e) => setMaxPrice(parseInt(e.target.value, 10))}
          className="form-range" 
        />
      </div>

      <div className="filter-section">
        <label>Minimum Rating</label>
        <div className="rating-pills">
          {[
            { label: "Any", val: 0 },
            { label: "3★+", val: 3 },
            { label: "4★+", val: 4 },
            { label: "4.5★+", val: 4.5 }
          ].map((pill) => (
            <button 
              key={pill.val}
              type="button"
              className={`pill-btn ${rating === pill.val ? "active" : ""}`}
              onClick={() => setRating(pill.val)}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <label className="checkbox-label">
          <input 
            type="checkbox" 
            checked={inStockOnly} 
            onChange={(e) => setInStockOnly(e.target.checked)} 
          />
          <span>In Stock Only</span>
        </label>
      </div>

      <div className="sidebar-actions">
        <button className="btn btn-primary btn-block" onClick={handleApply}>
          <Search size={16} /> Browse Products
        </button>
        <button className="btn btn-secondary btn-block" onClick={handleReset}>
          <RotateCcw size={16} /> Reset Filters
        </button>
      </div>
    </aside>
  );
}
