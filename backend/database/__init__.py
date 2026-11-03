"""Database package for AI Shopping Assistant.

Supports single and multi-database PostgreSQL routing with SQLAlchemy.
"""

from .connection import get_db, init_db, ENGINES
from .models import Product, Order, OrderItem
from .tools import (
    search_products_tool,
    filter_products_tool,
    get_product_by_id_tool,
    compare_products_tool,
    get_top_rated_tool,
)

__all__ = [
    "get_db",
    "init_db",
    "ENGINES",
    "Product",
    "Order",
    "OrderItem",
    "search_products_tool",
    "filter_products_tool",
    "get_product_by_id_tool",
    "compare_products_tool",
    "get_top_rated_tool",
]
