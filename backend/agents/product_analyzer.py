"""Product Analyzer Agent.

Extracts key specifications, performs sentiment analysis on reviews,
calculates deal scores, and identifies top product alternatives.
"""

from typing import Dict, Any, List, Optional
import re
from rag.retrieval.product_filter import SearchFilters


class ProductAnalyzerAgent:
    """Agent responsible for in-depth analysis of single product pages."""

    def __init__(self, retriever=None):
        self.retriever = retriever

    def calculate_deal_score(
        self,
        rating: float,
        price: float = 0.0,
        original_price: float = 0.0,
        pos_count: int = 0,
        neg_count: int = 0
    ) -> int:
        """Calculate a composite deal score between 0 and 100."""
        score = 65  # Base score

        # Rating contribution (up to +25 or -20)
        if rating > 0:
            if rating >= 4.5:
                score += 20
            elif rating >= 4.0:
                score += 12
            elif rating < 3.5:
                score -= 15

        # Discount contribution
        if original_price > price > 0:
            discount_pct = ((original_price - price) / original_price) * 100
            if discount_pct >= 40:
                score += 12
            elif discount_pct >= 20:
                score += 8

        # Sentiment contribution
        score += min(10, pos_count * 2)
        score -= min(15, neg_count * 3)

        return max(35, min(98, int(score)))

    def extract_sentiment(self, text: str) -> Dict[str, List[str]]:
        """Extract customer pros and cons from text and reviews."""
        pos_words = [
            "good", "great", "comfortable", "durable", "excellent", "worth",
            "quality", "fast", "battery", "recommend", "premium", "smooth", "stylish"
        ]
        neg_words = [
            "bad", "poor", "broken", "cheap", "waste", "tight", "damaged",
            "fake", "slow", "defect", "worst", "uncomfortable", "heavy"
        ]

        text_lower = text.lower()
        pos_hits = [w for w in pos_words if w in text_lower]
        neg_hits = [w for w in neg_words if w in text_lower]

        pros = []
        cons = []

        if pos_hits:
            pros.append(f"Customer praise: {', '.join(set(pos_hits[:4]))}.")
        if neg_hits:
            cons.append(f"Common customer complaints: {', '.join(set(neg_hits[:4]))}.")

        return {"pros": pros, "cons": cons, "pos_hits": pos_hits, "neg_hits": neg_hits}

    def analyze(
        self,
        title: str,
        price: float = 0.0,
        original_price: float = 0.0,
        rating_raw: Any = None,
        reviews: Optional[List[str]] = None,
        description: str = "",
        serialize_func = None
    ) -> Dict[str, Any]:
        """Perform comprehensive analysis of a live or catalog product."""
        # 1. Parse rating
        rating_val = 0.0
        if rating_raw:
            match = re.search(r"(\d+(?:\.\d+)?)", str(rating_raw))
            if match:
                rating_val = float(match.group(1))

        # 2. Sentiment analysis
        reviews_combined = " ".join(reviews or []) + " " + description
        sentiment = self.extract_sentiment(reviews_combined)

        pros = list(sentiment["pros"])
        cons = list(sentiment["cons"])

        if rating_val >= 4.0:
            pros.insert(0, f"Highly rated ({rating_val} / 5.0) with strong customer satisfaction.")
        elif rating_val > 0 and rating_val < 3.8:
            cons.insert(0, f"Average/Mixed rating ({rating_val} / 5.0) — inspect recent buyer reviews.")

        if not pros:
            pros.append("Solid market presence with standard manufacturer specifications.")
        if not cons:
            cons.append("Price may fluctuate; check return policy before final purchase.")

        # 3. Deal Score & Verdict
        deal_score = self.calculate_deal_score(
            rating=rating_val,
            price=price,
            original_price=original_price,
            pos_count=len(sentiment["pos_hits"]),
            neg_count=len(sentiment["neg_hits"])
        )

        verdict = (
            "Highly Recommended Buy 🏆" if deal_score >= 85
            else "Recommended Value Pick ✅" if deal_score >= 70
            else "Fair Deal – Review Alternatives ⚠️" if deal_score >= 55
            else "Proceed with Caution ❌"
        )

        # 4. Find similar products from catalog
        alternatives = []
        if self.retriever:
            try:
                retrieval_res = self.retriever.retrieve(title, SearchFilters())
                if serialize_func:
                    alternatives = [
                        serialize_func(row)
                        for _, row in retrieval_res.products.head(4).iterrows()
                    ]
            except Exception:
                alternatives = []

        short_title = " ".join(title.split()[:3])

        return {
            "title": title,
            "deal_score": deal_score,
            "verdict": verdict,
            "pros": pros,
            "cons": cons,
            "rating": rating_val,
            "alternatives": alternatives,
            "suggested_questions": [
                f"Is {short_title} worth buying?",
                f"Are there better alternatives under ₹{int(price) if price else 3000}?",
                f"Compare {short_title} with catalog alternatives",
            ]
        }
