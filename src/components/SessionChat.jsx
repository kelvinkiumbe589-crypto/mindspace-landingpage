import { useEffect, useRef, useState } from "react";
import { MessageSquare, X, Send } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";
const token = () => localStorage.getItem("mindspace_token");

/**
 * Private chat with the therapist for one booking. No contact details are ever
 * shown — just the therapist's name. Opens as a modal from a "Message" button.
 */
export default function SessionChat({ bookingId, title }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [canChat, setCanChat] = useState(true);
  const [name, setName] = useState(title || "Therapist");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const boxRef = useRef(null);

  const load = async () => {
    if (!token()) return;
    try {
      const r = await fetch(`${API_BASE}/api/sessions/${bookingId}/messages`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (r.ok) {
        const data = await r.json();
        setMessages(data.messages || []);
        setCanChat(data.canChat);
        if (data.counterpartyName) setName(data.counterpartyName);
      }
    } catch (e) {
      /* offline */
    }
  };

  // Poll while the panel is open.
  useEffect(() => {
    if (!open) return;
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [open]);

  useEffect(() => {
    const b = boxRef.current;
    if (b) b.scrollTop = b.scrollHeight;
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    setMessages((prev) => [...prev, { id: `tmp-${prev.length}`, text, mine: true, createdAt: new Date().toISOString() }]);
    try {
      const r = await fetch(`${API_BASE}/api/sessions/${bookingId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ text }),
      });
      if (r.ok) await load();
    } catch (e) {
      /* ignore */
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
      <button
        onClick={() => setOpen(true)}
        className="shrink-0 flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 transition-colors"
        title={`Message ${name}`}
      >
        <MessageSquare size={12} /> Message
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "min(420px, 100%)", height: "min(560px, 90vh)", background: "var(--elevated)", border: "1px solid var(--border)", borderRadius: "18px", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: "rgba(83,74,183,0.15)", borderBottom: "1px solid var(--border)" }}>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-strong)", margin: 0 }}>{name}</p>
                <p style={{ fontSize: "11px", color: "var(--text-dim)", margin: 0 }}>Private session chat</p>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div ref={boxRef} style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {messages.length === 0 && (
                <div style={{ margin: "auto", textAlign: "center", color: "var(--text-dim)", fontSize: "13px", padding: "20px" }}>
                  Messages are private between you and your therapist. Say hello 👋
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} style={{ display: "flex", justifyContent: m.mine ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "80%", padding: "9px 13px", borderRadius: "14px", fontSize: "13px", lineHeight: 1.5,
                    background: m.mine ? "#534AB7" : "var(--card-2)",
                    color: m.mine ? "#fff" : "var(--text-soft)",
                    border: m.mine ? "none" : "1px solid var(--border)", whiteSpace: "pre-wrap",
                  }}>
                    {m.text}
                    <span style={{ display: "block", fontSize: "9px", opacity: 0.6, marginTop: "3px" }}>{fmt(m.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            {canChat ? (
              <div style={{ display: "flex", gap: "8px", padding: "12px", borderTop: "1px solid var(--border)" }}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                  placeholder="Write a message…"
                  style={{ flex: 1, padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--card-2)", color: "var(--text)", fontSize: "13px", outline: "none" }}
                />
                <button onClick={send} disabled={sending || !input.trim()} style={{ width: "42px", borderRadius: "10px", border: "none", background: input.trim() ? "#534AB7" : "rgba(83,74,183,0.3)", color: "#fff", cursor: input.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Send size={16} />
                </button>
              </div>
            ) : (
              <div style={{ padding: "12px 14px", borderTop: "1px solid var(--border)", fontSize: "12px", color: "var(--text-dim)", textAlign: "center" }}>
                Chat opens once your session is confirmed.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
