import React from "react";
import { ShoppingCart, Scale, Check } from "lucide-react";

export default function ProductCard({
  product,
  onAddToCart,
  onToggleCompare,
  isComparing
}) {
  const discount = Math.round(product.discount_percent);
  const inStock = product.in_stock && product.stock_quantity > 0;

  let stockBadge = <span className="badge-stock badge-in">In stock</span>;
  if (!inStock) {
    stockBadge = <span className="badge-stock badge-out">Out of stock</span>;
  } else if (product.stock_quantity <= 10) {
    stockBadge = <span className="badge-stock badge-low">Only {product.stock_quantity} left</span>;
  }

  const stars = "★".repeat(Math.round(product.rating)) + "☆".repeat(5 - Math.round(product.rating));

  return (
    <div className="product-card" data-pid={product.product_id}>
      <div className="card-top">
        <span className="card-pid">{product.product_id}</span>
        {stockBadge}
      </div>

      <div className="card-title">{product.name}</div>
      <div className="card-meta">
        {product.brand} · {product.category} › {product.subcategory}
      </div>

      <div className="price-row">
        <span className="price-sale">₹{product.sale_price.toLocaleString("en-IN")}</span>
        {discount > 0 && (
          <>
            <span className="price-mrp">₹{product.price.toLocaleString("en-IN")}</span>
            <span className="badge-off">{discount}% off</span>
          </>
        )}
      </div>

      <div className="card-rating">
        <span>{stars}</span> <strong>{product.rating.toFixed(1)}</strong>{" "}
        <span style={{ color: "var(--text-subtle)" }}>({product.review_count} reviews)</span>
      </div>

      <div className="card-desc">{product.description}</div>

      <div className="card-tags">
        {product.sizes?.map((s) => (
          <span key={s} className="card-tag">Sz: {s}</span>
        ))}
        {product.colors?.map((c) => (
          <span key={c} className="card-tag">{c}</span>
        ))}
      </div>

      <div className="card-actions">
        <button 
          className="btn btn-primary" 
          disabled={!inStock} 
          onClick={() => onAddToCart(product)}
        >
          <ShoppingCart size={14} /> Add
        </button>

        <button 
          className="btn btn-secondary" 
          onClick={() => onToggleCompare(product.product_id)}
        >
          {isComparing ? (
            <><Check size={14} /> Selected</>
          ) : (
            <><Scale size={14} /> Compare</>
          )}
        </button>
      </div>
    </div>
  );
}
