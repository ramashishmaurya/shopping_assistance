"""Shopping Advisor Agent.

Coordinates multi-turn dialogue, catalog grounding via FAISS,
and conversational response generation.
"""

from typing import Dict, Any, List, Optional
import pandas as pd
from chatbot.shopping_assistant import ShoppingAssistant, AssistantResponse
from rag.retrieval.product_retriever import ProductRetriever
from chatbot.intent_detector import IntentDetector
from rag.llm.llm_factory import LLMSettings
from config import FREE_MODE


class ShoppingAdvisorAgent:
    """Conversational orchestrator that advises shoppers using catalog grounding."""

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
