import React from "react";
import { X, ShoppingCart, Trash2, Check, Scale } from "lucide-react";

export default function CompareModal({
  isOpen,
  onClose,
  compareProducts,
  onRemoveProduct,
  onAddToCart
}) {
  if (!isOpen) return null;

  return (
    <div className={`modal-backdrop ${isOpen ? "active" : ""}`} onClick={onClose}>
      <div 
        className="modal-dialog" 
        style={{ maxWidth: "950px" }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Scale size={20} color="var(--primary)" />
            <h3>Product Comparison Matrix ({compareProducts.length}/4)</h3>
          </div>
          <button className="icon-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {compareProducts.length < 2 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
              <Scale size={48} style={{ opacity: 0.3, marginBottom: "1rem" }} />
              <h4>Select at least 2 products to compare</h4>
              <p style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
                Click the <strong>Compare</strong> button on any product card in the catalog or chat recommendations.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="compare-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    {compareProducts.map((p) => (
                      <th key={p.product_id} style={{ minWidth: "220px", verticalAlign: "top" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-subtle)", fontFamily: "monospace" }}>
                            {p.product_id}
                          </span>
                          <button 
                            className="btn-remove-item"
                            title="Remove from compare"
                            onClick={() => onRemoveProduct(p.product_id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div style={{ marginTop: "0.4rem", fontWeight: 700, fontSize: "0.95rem" }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                          {p.brand}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th>Price</th>
                    {compareProducts.map((p) => {
                      const minPrice = Math.min(...compareProducts.map((cp) => cp.sale_price));
                      const isCheapest = p.sale_price === minPrice && compareProducts.length > 1;
                      return (
                        <td key={p.product_id}>
                          <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem" }}>
                            <span style={{ fontSize: "1.1rem", fontWeight: 800, color: isCheapest ? "var(--success)" : "var(--text-main)" }}>
                              ₹{p.sale_price.toLocaleString("en-IN")}
                            </span>
                            {p.price > p.sale_price && (
                              <span style={{ fontSize: "0.75rem", textDecoration: "line-through", color: "var(--text-subtle)" }}>
                                ₹{p.price.toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>
                          {isCheapest && (
                            <span style={{ fontSize: "0.7rem", color: "var(--success)", fontWeight: 700, display: "block", marginTop: "2px" }}>
                              Best Price
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  <tr>
                    <th>Rating</th>
                    {compareProducts.map((p) => {
                      const maxRating = Math.max(...compareProducts.map((cp) => cp.rating));
                      const isTopRated = p.rating === maxRating && compareProducts.length > 1;
                      return (
                        <td key={p.product_id}>
                          <span style={{ color: "var(--warning)", fontWeight: 700 }}>
                            ★ {p.rating.toFixed(1)}
                          </span>{" "}
                          <span style={{ fontSize: "0.75rem", color: "var(--text-subtle)" }}>
                            ({p.review_count} reviews)
                          </span>
                          {isTopRated && (
                            <span style={{ fontSize: "0.7rem", color: "var(--warning)", fontWeight: 700, display: "block", marginTop: "2px" }}>
                              Top Rated
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  <tr>
                    <th>Category</th>
                    {compareProducts.map((p) => (
                      <td key={p.product_id} style={{ fontSize: "0.82rem" }}>
                        {p.category} › {p.subcategory}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <th>Availability</th>
                    {compareProducts.map((p) => (
                      <td key={p.product_id}>
                        {p.in_stock && p.stock_quantity > 0 ? (
                          <span style={{ color: "var(--success)", fontWeight: 600 }}>
                            In Stock ({p.stock_quantity} units)
                          </span>
                        ) : (
                          <span style={{ color: "var(--danger)", fontWeight: 600 }}>
                            Out of Stock
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <th>Sizes</th>
                    {compareProducts.map((p) => (
                      <td key={p.product_id} style={{ fontSize: "0.8rem" }}>
                        {p.sizes && p.sizes.length > 0 ? p.sizes.join(", ") : "Universal / Free Size"}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <th>Colors</th>
                    {compareProducts.map((p) => (
                      <td key={p.product_id} style={{ fontSize: "0.8rem" }}>
                        {p.colors && p.colors.length > 0 ? p.colors.join(", ") : "Standard"}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <th>Action</th>
                    {compareProducts.map((p) => (
                      <td key={p.product_id}>
                        <button
                          className="btn btn-primary"
                          style={{ width: "100%", padding: "0.5rem" }}
                          disabled={!p.in_stock || p.stock_quantity === 0}
                          onClick={() => {
                            onAddToCart(p);
                            onClose();
                          }}
                        >
                          <ShoppingCart size={14} /> Add to Cart
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
