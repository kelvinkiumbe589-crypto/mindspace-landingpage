import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, X, Send, LifeBuoy } from "lucide-react";

const API_BASE = "http://localhost:8080";
const SEEN_KEY = "mindspace_support_seen";
const WHATSAPP_NUMBER = "254757306837"; // +254 757 306 837

export default function SupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [lastSeen, setLastSeen] = useState(() => Number(localStorage.getItem(SEEN_KEY) || 0));
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

  // Poll in the background (even when closed) so we can flag new admin replies.
  useEffect(() => {
    if (!token()) return;
    load();
    const id = setInterval(load, 12000);
    return () => clearInterval(id);
  }, []);

  // Poll faster while the panel is open.
  useEffect(() => {
    if (!open) return;
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [open]);

  // Timestamps (ms) of admin replies we've received.
  const adminTimes = useMemo(
    () =>
      messages
        .filter((m) => m.fromAdmin)
        .map((m) => new Date(m.createdAt).getTime())
        .filter((t) => !Number.isNaN(t)),
    [messages]
  );

  const unread = useMemo(() => adminTimes.filter((t) => t > lastSeen).length, [adminTimes, lastSeen]);

  // Broadcast the unread count so the header notification bell can mirror it.
  useEffect(() => {
    window.__mindspaceUnread = unread;
    window.dispatchEvent(new CustomEvent("mindspace:support-unread", { detail: unread }));
  }, [unread]);

  // Allow the bell (or anything else) to open the chat.
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("mindspace:open-support", handler);
    return () => window.removeEventListener("mindspace:open-support", handler);
  }, []);

  // While the panel is open, everything currently loaded counts as seen.
  useEffect(() => {
    if (!open || adminTimes.length === 0) return;
    const latest = Math.max(...adminTimes);
    if (latest > lastSeen) {
      localStorage.setItem(SEEN_KEY, String(latest));
      setLastSeen(latest);
    }
  }, [open, adminTimes, lastSeen]);

  useEffect(() => {
    const b = boxRef.current;
    if (b) b.scrollTop = b.scrollHeight;
  }, [messages, sending, open]);

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

  const badge = unread > 0 ? (unread > 9 ? "9+" : `+${unread}`) : null;
  const glowing = !open && unread > 0;

  return (
    <>
      {/* Floating WhatsApp button — direct message us */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi MindSpace, I need some help.")}`}
        target="_blank"
        rel="noreferrer"
        title="Message us on WhatsApp"
        style={{
          position: "fixed", bottom: "24px", right: "88px", zIndex: 250,
          width: "56px", height: "56px", borderRadius: "50%", textDecoration: "none",
          background: "#25D366", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 10px 30px rgba(37,211,102,0.45)",
        }}
      >
        {/* WhatsApp glyph (inline SVG — no extra dependency) */}
        <svg width="28" height="28" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
          <path d="M16.001 3.2C8.94 3.2 3.2 8.94 3.2 16c0 2.26.6 4.46 1.73 6.4L3.2 28.8l6.56-1.7A12.74 12.74 0 0 0 16 28.8C23.06 28.8 28.8 23.06 28.8 16S23.06 3.2 16 3.2zm0 23.09c-1.99 0-3.94-.53-5.64-1.54l-.4-.24-3.9 1.02 1.04-3.8-.26-.4A10.5 10.5 0 0 1 5.5 16c0-5.79 4.71-10.5 10.5-10.5S26.5 10.21 26.5 16 21.79 26.29 16 26.29zm5.77-7.86c-.32-.16-1.87-.92-2.16-1.03-.29-.11-.5-.16-.71.16-.21.32-.82 1.03-1 1.24-.18.21-.37.24-.68.08-.32-.16-1.34-.49-2.55-1.57-.94-.84-1.58-1.88-1.76-2.2-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.55.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.55-.08-.16-.71-1.72-.98-2.35-.26-.62-.52-.54-.71-.55l-.61-.01c-.21 0-.55.08-.84.4-.29.32-1.1 1.08-1.1 2.63s1.13 3.05 1.29 3.26c.16.21 2.22 3.39 5.38 4.75.75.32 1.34.52 1.8.66.76.24 1.44.21 1.98.13.6-.09 1.87-.76 2.13-1.5.26-.74.26-1.37.18-1.5-.08-.13-.29-.21-.61-.37z" />
        </svg>
      </a>

      {/* Floating support-chat button */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="Support chat"
        className={glowing ? "support-glow" : undefined}
        style={{
          position: "fixed", bottom: "24px", right: "24px", zIndex: 250,
          width: "56px", height: "56px", borderRadius: "50%", border: "none",
          background: "#534AB7", color: "#fff", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 10px 30px rgba(83,74,183,0.5)",
        }}
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
        {badge && (
          <span
            style={{
              position: "absolute", top: "-4px", right: "-4px", minWidth: "20px", height: "20px",
              padding: "0 5px", borderRadius: "10px", background: "#e5484d", color: "#fff",
              fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
              border: "2px solid var(--bg)", lineHeight: 1,
            }}
          >
            {badge}
          </span>
        )}
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
