"""Shopping Advisor Agent.

Coordinates multi-turn shopping dialogue, decides which database tool to invoke,
enforces exact user limit requests (e.g., "give me 5 phone", "top 3 shoes"),
and grounds conversational responses in catalog data.
"""

from typing import Dict, Any, List, Optional
import re
import pandas as pd
from chatbot.shopping_assistant import ShoppingAssistant, AssistantResponse
from rag.retrieval.product_retriever import ProductRetriever
from chatbot.intent_detector import IntentDetector
from rag.llm.llm_factory import LLMSettings
from config import FREE_MODE
from backend.database.tools import (
    search_products_tool,
    filter_products_tool,
    get_product_by_id_tool,
    compare_products_tool,
)


class ShoppingAdvisorAgent:
    """Conversational Tool-Calling Agent that advises shoppers using database tools."""

    def __init__(
        self,
        df: pd.DataFrame,
        retriever: ProductRetriever,
        detector: IntentDetector
    ):
        self.df = df
        self.retriever = retriever
        self.detector = detector
        self.assistant = ShoppingAssistant(df, retriever, detector)

        # Available agent tools
        self.tools = {
            "search_products": search_products_tool,
            "filter_catalog": filter_products_tool,
            "get_product_details": get_product_by_id_tool,
            "compare_products": compare_products_tool,
        }

    def extract_requested_limit(self, text: str) -> Optional[int]:
        """Extract explicit product count requested by the user.
        
        Handles: 'give me 5 phone', 'top 3 shoes', 'show two shirts', 'only 4', '5 items', etc.
        """
        num_words = {
            "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
            "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10
        }

        # 1. Look for patterns like "give me 5 phone", "top 3", "show 2 shirts"
        patterns = [
            r"\b(?:top|show|give me|only|best|first|suggest|find)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b",
            r"\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:items|products|options|phones?|shoes?|shirts?|tvs?|watches?|laptops?|books?|best)\b",
            r"\b(\d+)\s*(?:items|products|results|options)\b"
        ]

        for pat in patterns:
            m = re.search(pat, text, re.IGNORECASE)
            if m:
                val = m.group(1).lower()
                limit = num_words.get(val, int(val) if val.isdigit() else None)
                if limit and 1 <= limit <= 50:
                    return limit

        return None

    def execute_tool_search(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Tool Execution: Calls PostgreSQL / DB search tool with exact limit."""
        return search_products_tool(query=query, limit=limit)

    def execute_tool_filter(
        self,
        category: Optional[str] = None,
        max_price: Optional[float] = None,
        min_rating: Optional[float] = None,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Tool Execution: Calls PostgreSQL / DB filter tool with exact limit."""
        return filter_products_tool(
            category=category,
            max_price=max_price,
            min_rating=min_rating,
            limit=limit
        )

    def handle_query(
        self,
        message: str,
        session_id: str,
        cart_items: Optional[Dict[str, int]] = None,
        cart_variants: Optional[Dict[str, dict]] = None,
        llm_mode: str = FREE_MODE,
        llm_model: str = "openai/gpt-oss-120b",
        api_key: Optional[str] = None
    ) -> AssistantResponse:
        """Handle incoming user message with catalog grounding."""
        llm = LLMSettings(
            mode=llm_mode,
            model=llm_model,
            api_key=api_key or ""
        )

        return self.assistant.handle_message(
            user_text=message,
            llm=llm,
            session_id=session_id
        )
