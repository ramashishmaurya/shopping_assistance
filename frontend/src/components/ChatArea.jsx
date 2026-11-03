import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Trash2, ArrowRight } from "lucide-react";
import ProductCard from "./ProductCard";

export default function ChatArea({
  messages,
  isThinking,
  onSendMessage,
  onClearChat,
  onAddToCart,
  onToggleCompare,
  compareList
}) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handlePromptClick = (promptText) => {
    if (isThinking) return;
    onSendMessage(promptText);
  };

  // Helper function to format basic markdown text safely
  const formatMarkdown = (text) => {
    if (!text) return "";
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      // Bold text replacement **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const renderedParts = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        return (
          <li key={idx} style={{ marginLeft: "1.2rem", marginBottom: "0.25rem" }}>
            {renderedParts}
          </li>
        );
      }
      return (
        <p key={idx} style={{ marginBottom: line ? "0.45rem" : "0.2rem" }}>
          {renderedParts}
        </p>
      );
    });
  };

  return (
    <div className="chat-viewport">
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="message-card assistant welcome-hero">
            <div className="msg-avatar">
              <Bot size={20} />
            </div>
            <div className="msg-content">
              <h2 className="welcome-title">
                Welcome to <span>ShopMind AI</span>
              </h2>
              <p className="welcome-desc">
                Your personal grounded e-commerce assistant. Ask for recommendations, 
                compare products, check stock availability, or find the best deals within 
                our 1,000+ verified catalog.
              </p>

              <div className="quick-prompts">
                <span className="prompts-label">Try Asking:</span>
                <div className="prompt-chips">
                  <button 
                    className="chip-btn"
                    onClick={() => handlePromptClick("Suggest best running shoes under ₹3000")}
                  >
                    👟 Best running shoes under ₹3000
                  </button>
                  <button 
                    className="chip-btn"
                    onClick={() => handlePromptClick("Compare cotton t-shirts in stock")}
                  >
                    👕 Compare cotton t-shirts in stock
                  </button>
                  <button 
                    className="chip-btn"
                    onClick={() => handlePromptClick("Show 4K Smart TVs with high discounts")}
                  >
                    📺 4K Smart TVs with high discounts
                  </button>
                  <button 
                    className="chip-btn"
                    onClick={() => handlePromptClick("Show top-rated wireless earbuds")}
                  >
                    🎧 Top-rated wireless earbuds
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`message-card ${msg.role === "user" ? "user" : "assistant"}`}
            >
              <div className="msg-avatar">
                {msg.role === "user" ? <User size={18} /> : <Sparkles size={18} />}
              </div>
              <div className="msg-content">
                <div className="text-body">
                  {formatMarkdown(msg.content)}
                </div>

                {msg.products && msg.products.length > 0 && (
                  <div className="products-grid-container">
                    <div className="products-grid-header">
                      <span>Relevant Products ({msg.products.length})</span>
                    </div>
                    <div className="products-carousel">
                      {msg.products.map((prod) => (
                        <ProductCard
                          key={prod.product_id}
                          product={prod}
                          onAddToCart={onAddToCart}
                          onToggleCompare={onToggleCompare}
                          isComparing={compareList.includes(prod.product_id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {isThinking && (
          <div className="message-card assistant">
            <div className="msg-avatar">
              <Bot size={18} />
            </div>
            <div className="msg-content" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span className="typing-indicator">
                ShopMind is thinking & retrieving catalog data...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-bar">
        <form className="chat-form" onSubmit={handleSubmit}>
          <div className="input-wrapper">
            <input
              type="text"
              className="chat-input"
              placeholder="Ask anything (e.g., 'Compare wireless headphones under ₹2500')..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isThinking}
            />
            <button 
              type="submit" 
              className="btn-send" 
              disabled={!input.trim() || isThinking}
              aria-label="Send message"
            >
              <ArrowRight size={18} />
            </button>
          </div>
          <div className="input-footer">
            <span className="footer-tip">
              ⚡ Grounded with FAISS Vector Search & Real-time Catalog Filtering
            </span>
            {messages.length > 0 && (
              <button 
                type="button" 
                className="btn-clear-chat" 
                onClick={onClearChat}
              >
                Clear History
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
