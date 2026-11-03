import React, { useState } from "react";
import { X, Key, Server, Save, Check } from "lucide-react";

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings
}) {
  const [apiUrl, setApiUrl] = useState(settings.apiUrl || "http://127.0.0.1:8000");
  const [llmMode, setLlmMode] = useState(settings.llmMode || "free");
  const [groqKey, setGroqKey] = useState(settings.groqKey || "");
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveSettings({
      apiUrl: apiUrl.trim().replace(/\/$/, ""),
      llmMode,
      groqKey: groqKey.trim()
    });
    onClose();
  };

  return (
    <div className={`modal-backdrop ${isOpen ? "active" : ""}`} onClick={onClose}>
      <div 
        className="modal-dialog modal-sm" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Server size={18} color="var(--primary)" />
            <h3>Assistant & API Settings</h3>
          </div>
          <button className="icon-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            <div className="filter-group">
              <label className="filter-label" htmlFor="backend-url">
                Backend API Server URL
              </label>
              <input
                id="backend-url"
                type="text"
                className="filter-input"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://127.0.0.1:8000"
                required
              />
              <span style={{ fontSize: "0.72rem", color: "var(--text-subtle)", marginTop: "0.25rem", display: "block" }}>
                Points to FastAPI backend (localhost for dev or deployed cloud URL on Render/Railway).
              </span>
            </div>

            <div className="filter-group">
              <label className="filter-label">
                AI Inference Engine Mode
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.3rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="llmMode"
                    value="free"
                    checked={llmMode === "free"}
                    onChange={(e) => setLlmMode(e.target.value)}
                  />
                  <span>
                    <strong>Free Grounded Mode</strong> (Instant FAISS retrieval & catalog heuristics)
                  </span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="llmMode"
                    value="groq"
                    checked={llmMode === "groq"}
                    onChange={(e) => setLlmMode(e.target.value)}
                  />
                  <span>
                    <strong>Groq Llama 3.3</strong> (Ultra-fast real LLM responses)
                  </span>
                </label>
              </div>
            </div>

            {llmMode === "groq" && (
              <div className="filter-group">
                <label className="filter-label" htmlFor="groq-key">
                  Groq API Key (Optional)
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="groq-key"
                    type={showKey ? "text" : "password"}
                    className="filter-input"
                    value={groqKey}
                    onChange={(e) => setGroqKey(e.target.value)}
                    placeholder="gsk_..."
                  />
                  <button
                    type="button"
                    style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "var(--text-subtle)", cursor: "pointer", fontSize: "0.75rem" }}
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? "Hide" : "Show"}
                  </button>
                </div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-subtle)", marginTop: "0.25rem", display: "block" }}>
                  Stored safely in browser localStorage.
                </span>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={15} /> Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
