"""SQLAlchemy ORM Models for Shopping Assistant.

Supports storing products, variants, orders, and multi-database entities.
"""

from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    Boolean,
    Text,
    DateTime,
    ForeignKey,
    Index
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Product(Base):
    """Product entity stored in PostgreSQL."""
    __tablename__ = "products"

    product_id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    category = Column(String(128), nullable=False, index=True)
    subcategory = Column(String(128), nullable=False, index=True)
    brand = Column(String(128), nullable=False, index=True)
    price = Column(Float, nullable=False, default=0.0)
    discount_percent = Column(Float, nullable=False, default=0.0)
    sale_price = Column(Float, nullable=False, index=True, default=0.0)
    description = Column(Text, nullable=True)
    rating = Column(Float, nullable=False, index=True, default=0.0)
    review_count = Column(Integer, nullable=False, default=0)
    sizes = Column(String(255), nullable=True)     # Comma-separated: "S, M, L, XL"
    colors = Column(String(255), nullable=True)    # Comma-separated: "Black, Blue"
    stock_quantity = Column(Integer, nullable=False, default=0)
    in_stock = Column(Boolean, nullable=False, index=True, default=True)
    material = Column(String(128), nullable=True)
    tags = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_products_cat_price", "category", "sale_price"),
        Index("ix_products_cat_rating", "category", "rating"),
    )

    def to_dict(self):
        """Serialize Product model to dictionary matching API schema."""
        return {
            "product_id": self.product_id,
            "name": self.name,
            "category": self.category,
            "subcategory": self.subcategory,
            "brand": self.brand,
            "price": float(self.price),
            "discount_percent": float(self.discount_percent),
            "sale_price": float(self.sale_price),
            "description": self.description or "",
            "rating": float(self.rating),
            "review_count": int(self.review_count),
            "sizes": [s.strip() for s in (self.sizes or "").split(",") if s.strip()],
            "colors": [c.strip() for c in (self.colors or "").split(",") if c.strip()],
            "stock_quantity": int(self.stock_quantity),
            "in_stock": bool(self.in_stock),
            "material": self.material or "",
            "tags": [t.strip() for t in (self.tags or "").split(",") if t.strip()],
        }


class Order(Base):
    """Customer order entity."""
    __tablename__ = "orders"

    order_id = Column(String(64), primary_key=True)
    customer_id = Column(String(64), nullable=True)
    total_amount = Column(Float, nullable=False, default=0.0)
    status = Column(String(32), default="pending")  # pending, paid, shipped, cancelled
    created_at = Column(DateTime, default=datetime.utcnow)

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    """Line items within an order."""
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(String(64), ForeignKey("orders.order_id"), nullable=False)
    product_id = Column(String(64), nullable=False)
    product_name = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False, default=0.0)
    selected_size = Column(String(32), nullable=True)
    selected_color = Column(String(32), nullable=True)

    order = relationship("Order", back_populates="items")
