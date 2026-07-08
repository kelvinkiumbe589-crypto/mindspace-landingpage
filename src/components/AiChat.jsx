import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

/**
 * Floating AI assistant. Sits above the WhatsApp button and opens a lightweight
 * chat panel backed by the public /api/ai/chat endpoint (Gemini). No login needed.
 */
export default function AiChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]); // { role: "user" | "ai", text }
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);

  // Keep the transcript scrolled to the latest message.
  useEffect(() => {
    const b = boxRef.current;
    if (b) b.scrollTop = b.scrollHeight;
  }, [messages, loading, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const history = messages.slice(-8);
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moodContext: "The user is chatting with the MindSpace wellness assistant.",
          question: text,
          history: history.map((m) => ({ role: m.role, text: m.text })),
        }),
      });
      if (!res.ok) throw new Error("bad");
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "ai", text: data.reply }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Sorry — I couldn't reach the assistant just now. Please try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating AI button — stacked above the WhatsApp button */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="Ask the MindSpace AI"
        style={{
          position: "fixed", bottom: "152px", right: "24px", zIndex: 250,
          width: "56px", height: "56px", borderRadius: "50%", border: "none",
          background: "linear-gradient(135deg, #7F77DD, #534AB7)", color: "#fff", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 10px 30px rgba(83,74,183,0.5)",
        }}
      >
        {open ? <X size={24} /> : <Sparkles size={24} />}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          style={{
            position: "fixed", bottom: "152px", right: "88px", zIndex: 250,
            width: "min(360px, calc(100vw - 32px))", height: "min(480px, calc(100vh - 180px))",
            background: "var(--elevated)", border: "1px solid var(--border)", borderRadius: "18px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.4)", display: "flex", flexDirection: "column", overflow: "hidden",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px", background: "rgba(83,74,183,0.15)", borderBottom: "1px solid var(--border)" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "linear-gradient(135deg, #7F77DD, #534AB7)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              <Sparkles size={18} />
            </div>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-strong)", margin: 0 }}>MindSpace AI</p>
              <p style={{ fontSize: "11px", color: "var(--text-dim)", margin: 0 }}>Your wellness assistant</p>
            </div>
          </div>

          {/* Messages */}
          <div ref={boxRef} style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {messages.length === 0 && (
              <div style={{ margin: "auto", textAlign: "center", color: "var(--text-dim)", fontSize: "13px", padding: "20px" }}>
                <Sparkles size={26} style={{ marginBottom: "8px", opacity: 0.6 }} />
                <p style={{ margin: 0 }}>Hi 👋 Ask me anything about your wellbeing, moods, or how to feel a little better today.</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "82%", padding: "9px 13px", borderRadius: "14px", fontSize: "13px", lineHeight: 1.5,
                  background: m.role === "user" ? "#534AB7" : "var(--card-2)",
                  color: m.role === "user" ? "#fff" : "var(--text-soft)",
                  border: m.role === "user" ? "none" : "1px solid var(--border)",
                  whiteSpace: "pre-wrap",
                }}>
                  {m.role === "ai" && <span style={{ display: "block", fontSize: "10px", color: "#a89cf5", fontWeight: 600, marginBottom: "2px" }}>MindSpace AI</span>}
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ padding: "9px 13px", borderRadius: "14px", fontSize: "13px", background: "var(--card-2)", color: "var(--text-dim)", border: "1px solid var(--border)" }}>
                  Thinking…
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{ display: "flex", gap: "8px", padding: "12px", borderTop: "1px solid var(--border)" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              placeholder="Ask the assistant…"
              style={{ flex: 1, padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--card-2)", color: "var(--text)", fontSize: "13px", outline: "none" }}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              style={{ width: "42px", borderRadius: "10px", border: "none", background: input.trim() ? "#534AB7" : "rgba(83,74,183,0.3)", color: "#fff", cursor: input.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
