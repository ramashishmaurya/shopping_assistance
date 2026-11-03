import React from "react";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

export default function Toast({ toasts }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast">
          {toast.type === "error" ? (
            <AlertCircle size={16} color="var(--danger)" />
          ) : toast.type === "info" ? (
            <Info size={16} color="var(--accent-blue)" />
          ) : (
            <CheckCircle2 size={16} color="var(--success)" />
          )}
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
