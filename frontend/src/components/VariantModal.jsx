import React, { useState, useEffect } from "react";
import { X, ShoppingCart, Check } from "lucide-react";

export default function VariantModal({
  isOpen,
  onClose,
  product,
  onConfirm
}) {
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes?.[0] || "");
      setSelectedColor(product.colors?.[0] || "");
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleConfirm = () => {
    onConfirm(product, selectedSize, selectedColor);
    onClose();
  };

  return (
    <div className={`modal-backdrop ${isOpen ? "active" : ""}`} onClick={onClose}>
      <div 
        className="modal-dialog modal-sm" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Select Options</h3>
          <button className="icon-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ marginBottom: "1rem" }}>
            <h4 style={{ fontSize: "1rem", fontWeight: 700 }}>{product.name}</h4>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
              {product.brand} · ₹{product.sale_price.toLocaleString("en-IN")}
            </div>
          </div>

          {product.sizes && product.sizes.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-subtle)", textTransform: "uppercase" }}>
                Select Size: {selectedSize && <strong>{selectedSize}</strong>}
              </label>
              <div className="variant-options">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`variant-chip ${selectedSize === s ? "selected" : ""}`}
                    onClick={() => setSelectedSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.colors && product.colors.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-subtle)", textTransform: "uppercase" }}>
                Select Color: {selectedColor && <strong>{selectedColor}</strong>}
              </label>
              <div className="variant-options">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`variant-chip ${selectedColor === c ? "selected" : ""}`}
                    onClick={() => setSelectedColor(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleConfirm}>
            <ShoppingCart size={15} /> Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
