"""AI Shopping Assistant Multi-Agent Architecture.

Modules:
- product_analyzer: Deals score, sentiment, pros/cons, and spec breakdown.
- product_comparator: Side-by-side spec comparison, attribute winners, and trade-offs.
- shopping_advisor: Multi-turn grounded shopping advisor with catalog grounding.
"""

from .product_analyzer import ProductAnalyzerAgent
from .product_comparator import ProductComparatorAgent
from .shopping_advisor import ShoppingAdvisorAgent

__all__ = [
    "ProductAnalyzerAgent",
    "ProductComparatorAgent",
    "ShoppingAdvisorAgent",
]
