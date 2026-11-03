import React from "react";
import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQty,
  onRemoveItem,
  onCheckout
}) {
  const pids = Object.keys(cart.items);
  const totalCount = Object.values(cart.items).reduce((a, b) => a + b, 0);

  let totalAmount = 0;
  pids.forEach((pid) => {
    const qty = cart.items[pid];
    const variant = cart.variants[pid] || {};
    totalAmount += (variant.price || 0) * qty;
  });

  return (
    <div className={`drawer-overlay ${isOpen ? "active" : ""}`} onClick={(e) => {
      if (e.target.classList.contains("drawer-overlay")) onClose();
    }}>
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Shopping Cart">
        <div className="drawer-header">
          <div className="drawer-title">
            <h3>Your Shopping Cart</h3>
            <span className="drawer-subtitle">{totalCount} item{totalCount !== 1 ? "s" : ""}</span>
          </div>
          <button className="icon-close" onClick={onClose} aria-label="Close Cart">
            <X size={20} />
          </button>
        </div>

        <div className="drawer-body">
          {pids.length === 0 ? (
            <div className="cart-empty">
              <ShoppingBag size={48} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
              <p><strong>Your cart is empty</strong></p>
              <p style={{ fontSize: "0.82rem", marginTop: "4px" }}>
                Ask in the chat or browse products to add items.
              </p>
            </div>
          ) : (
            pids.map((pid) => {
              const qty = cart.items[pid];
              const variant = cart.variants[pid] || {};
              const itemTotal = (variant.price || 0) * qty;

              return (
                <div key={pid} className="cart-item-card">
                  <div className="cart-item-top">
                    <div>
                      <div className="cart-item-name">{variant.name || pid}</div>
                      <div className="cart-item-variant">
                        Size: {variant.size || "Standard"}{" "}
                        {variant.colour ? `· ${variant.colour}` : ""}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700 }}>₹{itemTotal.toLocaleString("en-IN")}</div>
                  </div>

                  <div className="cart-item-controls">
                    <div className="qty-stepper">
                      <button className="qty-btn" onClick={() => onUpdateQty(pid, -1)}>
                        <Minus size={14} />
                      </button>
                      <span className="qty-val">{qty}</span>
                      <button className="qty-btn" onClick={() => onUpdateQty(pid, 1)}>
                        <Plus size={14} />
                      </button>
                    </div>

                    <button className="btn-remove-item" onClick={() => onRemoveItem(pid)}>
                      <Trash2 size={14} style={{ display: "inline", verticalAlign: "middle" }} /> Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {pids.length > 0 && (
          <div className="drawer-footer">
            <div className="summary-line">
              <span>Subtotal</span>
              <span>₹{totalAmount.toLocaleString("en-IN")}</span>
            </div>
            <div className="summary-line">
              <span>Delivery</span>
              <span style={{ color: "var(--success)" }}>FREE</span>
            </div>
            <div className="summary-line total-line">
              <span>Total Payable</span>
              <span className="total-amount">₹{totalAmount.toLocaleString("en-IN")}</span>
            </div>

            <button className="btn btn-primary btn-block btn-checkout" onClick={onCheckout}>
              Proceed to Checkout 🛍️
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
