"""Product Comparator Agent.

Generates multi-product comparative matrices, highlights winners for
price/rating/discount, and computes analytical trade-offs.
"""

from typing import List, Dict, Any
import pandas as pd


class ProductComparatorAgent:
    """Agent that performs multi-attribute comparison between multiple products."""

    def __init__(self, df: pd.DataFrame = None):
        self.df = df

    def compare(self, products: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Perform side-by-side comparison across products."""
        if not products or len(products) < 2:
            return {
                "error": "At least 2 products are required for comparison.",
                "winners": {},
                "summary": ""
            }

        # 1. Identify attribute winners
        min_price = min(p["sale_price"] for p in products)
        max_rating = max(p["rating"] for p in products)
        max_discount = max(p.get("discount_percent", 0) for p in products)

        price_winners = [p["name"] for p in products if p["sale_price"] == min_price]
        rating_winners = [p["name"] for p in products if p["rating"] == max_rating]
        discount_winners = [p["name"] for p in products if p.get("discount_percent", 0) == max_discount]

        # 2. Build summary commentary
        cheapest_name = price_winners[0]
        top_rated_name = rating_winners[0]

        summary_points = []
        if cheapest_name == top_rated_name:
            summary_points.append(
                f"**Clear Overall Winner**: {cheapest_name} leads both in price (₹{min_price:,.0f}) and customer rating ({max_rating:.1f}★)."
            )
        else:
            summary_points.append(
                f"**Budget Pick**: {cheapest_name} offers the lowest price at ₹{min_price:,.0f}."
            )
            summary_points.append(
                f"**Quality Pick**: {top_rated_name} holds the highest customer rating at {max_rating:.1f}★."
            )

        in_stock_count = sum(1 for p in products if p.get("in_stock"))
        summary_points.append(
            f"{in_stock_count} of {len(products)} compared products are currently in stock and ready to ship."
        )

        return {
            "products": products,
            "winners": {
                "best_price": {
                    "product_name": cheapest_name,
                    "price": min_price
                },
                "top_rated": {
                    "product_name": top_rated_name,
                    "rating": max_rating
                },
                "highest_discount": {
                    "product_name": discount_winners[0],
                    "discount_percent": max_discount
                }
            },
            "summary": "\n".join(f"- {pt}" for pt in summary_points)
        }
