"""AI Agent Database Tools.

Specialized query tools that interface with PostgreSQL to fetch products,
execute filtered searches, enforce exact limits (e.g., top 3), and support
multiple database engine binds.
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from .connection import get_session
from .models import Product


def search_products_tool(
    query: str,
    limit: int = 3,
    bind: str = "default"
) -> List[Dict[str, Any]]:
    """Tool: Searches products by keyword/name with an exact limit.
    
    Args:
        query: Search term (e.g., 'running shoes', 'cotton t-shirt', 'smart tv').
        limit: Exact maximum number of products to return (default: 3).
        bind: Database bind name (default or catalog).
    """
    session = get_session(bind)
    try:
        search_pattern = f"%{query.strip()}%"
        stmt = (
            session.query(Product)
            .filter(
                or_(
                    Product.name.ilike(search_pattern),
                    Product.description.ilike(search_pattern),
                    Product.tags.ilike(search_pattern),
                    Product.brand.ilike(search_pattern),
                    Product.subcategory.ilike(search_pattern)
                )
            )
            .order_by(desc(Product.rating), desc(Product.review_count))
            .limit(limit)
        )
        products = stmt.all()
        return [p.to_dict() for p in products]
    finally:
        session.close()


def filter_products_tool(
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
    brand: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
    in_stock_only: bool = True,
    sort_by: str = "rating_desc",
    limit: int = 3,
    bind: str = "default"
) -> List[Dict[str, Any]]:
    """Tool: Filters products using structured attributes with exact limit.
    
    Args:
        category: Main category (e.g., 'Footwear', 'Clothing', 'Electronics').
        subcategory: Subcategory (e.g., 'Running Shoes', 'Formal Shirts').
        brand: Brand name.
        min_price: Minimum price in INR.
        max_price: Budget cap in INR (e.g., 3000).
        min_rating: Minimum customer star rating (e.g., 4.0).
        in_stock_only: Filter only items in stock.
        sort_by: Sorting order ('rating_desc', 'price_asc', 'discount_desc').
        limit: Exact number of products to return (default: 3).
        bind: Target database engine.
    """
    session = get_session(bind)
    try:
        query = session.query(Product)

        if category:
            query = query.filter(Product.category.ilike(category.strip()))
        if subcategory:
            query = query.filter(Product.subcategory.ilike(subcategory.strip()))
        if brand:
            query = query.filter(Product.brand.ilike(brand.strip()))
        if min_price is not None:
            query = query.filter(Product.sale_price >= min_price)
        if max_price is not None:
            query = query.filter(Product.sale_price <= max_price)
        if min_rating is not None:
            query = query.filter(Product.rating >= min_rating)
        if in_stock_only:
            query = query.filter(Product.in_stock == True, Product.stock_quantity > 0)

        # Apply sorting
        if sort_by == "price_asc":
            query = query.order_by(asc(Product.sale_price))
        elif sort_by == "price_desc":
            query = query.order_by(desc(Product.sale_price))
        elif sort_by == "discount_desc":
            query = query.order_by(desc(Product.discount_percent))
        else:  # default rating_desc
            query = query.order_by(desc(Product.rating), desc(Product.review_count))

        # Enforce exact user limit
        results = query.limit(limit).all()
        return [p.to_dict() for p in results]
    finally:
        session.close()


def get_product_by_id_tool(
    product_id: str,
    bind: str = "default"
) -> Optional[Dict[str, Any]]:
    """Tool: Fetches complete details of a single product by ID."""
    session = get_session(bind)
    try:
        product = session.query(Product).filter(Product.product_id == product_id.strip()).first()
        return product.to_dict() if product else None
    finally:
        session.close()


def compare_products_tool(
    product_ids: List[str],
    bind: str = "default"
) -> Dict[str, Any]:
    """Tool: Retrieves products for comparison and calculates feature winners."""
    session = get_session(bind)
    try:
        products = session.query(Product).filter(Product.product_id.in_(product_ids)).all()
        serialized = [p.to_dict() for p in products]

        if not serialized:
            return {"error": "No matching products found", "products": []}

        min_price = min(p["sale_price"] for p in serialized)
        max_rating = max(p["rating"] for p in serialized)

        return {
            "products": serialized,
            "comparison_count": len(serialized),
            "cheapest_product": [p["name"] for p in serialized if p["sale_price"] == min_price][0],
            "highest_rated_product": [p["name"] for p in serialized if p["rating"] == max_rating][0],
        }
    finally:
        session.close()


def get_top_rated_tool(
    category: Optional[str] = None,
    limit: int = 3,
    bind: str = "default"
) -> List[Dict[str, Any]]:
    """Tool: Fetches the top-rated products in a category with exact limit."""
    return filter_products_tool(category=category, sort_by="rating_desc", limit=limit, bind=bind)
