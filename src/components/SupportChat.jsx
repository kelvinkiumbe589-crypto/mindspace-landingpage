import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, LifeBuoy } from "lucide-react";

const API_BASE = "http://localhost:8080";

export default function SupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const boxRef = useRef(null);

  const token = () => localStorage.getItem("mindspace_token");

  const load = async () => {
    if (!token()) return;
    try {
      const res = await fetch(`${API_BASE}/api/support/me`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) setMessages(await res.json());
    } catch (e) {
      /* offline — keep what we have */
    }
  };

  // Load + poll every 5s while the panel is open
  useEffect(() => {
    if (!open) return;
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [open]);

  useEffect(() => {
    const b = boxRef.current;
    if (b) b.scrollTop = b.scrollHeight;
  }, [messages, sending]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    if (!token()) {
      setError("Please sign in to chat with support.");
      return;
    }
    setSending(true);
    setError("");
    // optimistic
    setMessages((prev) => [...prev, { id: `tmp-${Date.now()}`, text, fromAdmin: false, createdAt: new Date().toISOString() }]);
    setInput("");
    try {
      const res = await fetch(`${API_BASE}/api/support`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ text }),
      });
      if (res.ok) await load();
      else throw new Error("failed");
    } catch (e) {
      setError("Couldn't send — is the server running on port 8080?");
    } finally {
      setSending(false);
    }
  };

  const fmt = (iso) => {
    try {
      return new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    } catch (e) {
      return "";
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="Support chat"
        style={{
          position: "fixed", bottom: "24px", right: "24px", zIndex: 250,
          width: "56px", height: "56px", borderRadius: "50%", border: "none",
          background: "#534AB7", color: "#fff", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 10px 30px rgba(83,74,183,0.5)",
        }}
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Panel */}
      {open && (
        <div
          style={{
            position: "fixed", bottom: "92px", right: "24px", zIndex: 250,
            width: "min(360px, calc(100vw - 32px))", height: "min(480px, calc(100vh - 130px))",
            background: "var(--elevated)", border: "1px solid var(--border)", borderRadius: "18px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.4)", display: "flex", flexDirection: "column", overflow: "hidden",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px", background: "rgba(83,74,183,0.15)", borderBottom: "1px solid var(--border)" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "#534AB7", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              <LifeBuoy size={18} />
            </div>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-strong)", margin: 0 }}>MindSpace Support</p>
              <p style={{ fontSize: "11px", color: "var(--text-dim)", margin: 0 }}>We usually reply within a day</p>
            </div>
          </div>

          {/* Messages */}
          <div ref={boxRef} style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {messages.length === 0 && (
              <div style={{ margin: "auto", textAlign: "center", color: "var(--text-dim)", fontSize: "13px", padding: "20px" }}>
                <LifeBuoy size={26} style={{ marginBottom: "8px", opacity: 0.6 }} />
                <p style={{ margin: 0 }}>Hi 👋 Describe your issue and our team will reply right here.</p>
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} style={{ display: "flex", justifyContent: m.fromAdmin ? "flex-start" : "flex-end" }}>
                <div style={{
                  maxWidth: "80%", padding: "9px 13px", borderRadius: "14px", fontSize: "13px", lineHeight: 1.5,
                  background: m.fromAdmin ? "var(--card-2)" : "#534AB7",
                  color: m.fromAdmin ? "var(--text-soft)" : "#fff",
                  border: m.fromAdmin ? "1px solid var(--border)" : "none",
                }}>
                  {m.fromAdmin && <span style={{ display: "block", fontSize: "10px", color: "var(--accent-soft)", fontWeight: 600, marginBottom: "2px" }}>Support</span>}
                  {m.text}
                  <span style={{ display: "block", fontSize: "9px", opacity: 0.6, marginTop: "3px" }}>{fmt(m.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Error */}
          {error && <div style={{ fontSize: "12px", color: "#f0a07a", padding: "0 14px 8px" }}>{error}</div>}

          {/* Input */}
          <div style={{ display: "flex", gap: "8px", padding: "12px", borderTop: "1px solid var(--border)" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              placeholder="Describe your issue…"
              style={{ flex: 1, padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--card-2)", color: "var(--text)", fontSize: "13px", outline: "none" }}
            />
            <button
              onClick={send}
              disabled={sending || !input.trim()}
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
