import { useEffect, useState } from "react";
import { X, Star, Heart } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";
const RATED_KEY = "mindspace_rated";
const DISMISSED_KEY = "mindspace_rating_dismissed";

const token = () => localStorage.getItem("mindspace_token");

/**
 * "Rate MindSpace" popup. Opens on the `mindspace:open-rating` window event
 * (from the sidebar) and can auto-open once via `mindspace:maybe-rating`
 * (from the dashboard) if the user hasn't rated or dismissed it yet.
 */
export default function RatingModal() {
  const [open, setOpen] = useState(false);
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const openHandler = () => { setOpen(true); setDone(false); setError(""); };
    const maybeHandler = () => {
      if (localStorage.getItem(RATED_KEY) || localStorage.getItem(DISMISSED_KEY)) return;
      if (!token()) return; // only prompt signed-in users
      setOpen(true); setDone(false); setError("");
    };
    window.addEventListener("mindspace:open-rating", openHandler);
    window.addEventListener("mindspace:maybe-rating", maybeHandler);
    return () => {
      window.removeEventListener("mindspace:open-rating", openHandler);
      window.removeEventListener("mindspace:maybe-rating", maybeHandler);
    };
  }, []);

  // Prefill with the user's existing rating when the modal opens.
  useEffect(() => {
    if (!open || !token()) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/ratings/me`, { headers: { Authorization: `Bearer ${token()}` } });
        if (res.ok) {
          const r = await res.json();
          if (r && r.stars) { setStars(r.stars); setComment(r.comment || ""); }
        }
      } catch (e) {}
    })();
  }, [open]);

  const close = () => {
    // Remember a dismissal so we don't auto-nag again.
    if (!localStorage.getItem(RATED_KEY)) localStorage.setItem(DISMISSED_KEY, "1");
    setOpen(false);
  };

  const submit = async () => {
    if (stars < 1) { setError("Please tap a star to rate."); return; }
    if (saving) return;
    if (!token()) { setError("Please sign in to rate."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch(`${API_BASE}/api/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ stars, comment: comment.trim() }),
      });
      if (!res.ok) throw new Error("failed");
      localStorage.setItem(RATED_KEY, "1");
      localStorage.removeItem(DISMISSED_KEY);
      setDone(true);
    } catch (e) {
      setError("Couldn't submit your rating. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const shown = hover || stars;

  return (
    <div onClick={close} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "400px", background: "var(--elevated)", border: "1px solid var(--border)", borderRadius: "20px", overflow: "hidden", boxShadow: "0 30px 70px rgba(0,0,0,0.5)" }}>
        <div style={{ position: "relative", padding: "22px", background: "linear-gradient(135deg, #534AB7, #7a5cd0)", color: "#fff" }}>
          <button onClick={close} style={{ position: "absolute", top: "14px", right: "14px", background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", width: "28px", height: "28px", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
          <p style={{ fontSize: "17px", fontWeight: 700, margin: 0 }}>Enjoying MindSpace?</p>
          <p style={{ fontSize: "12px", opacity: 0.85, margin: "2px 0 0" }}>Your rating helps us improve</p>
        </div>

        {done ? (
          <div style={{ padding: "34px 24px", textAlign: "center" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(83,74,183,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: "#534AB7" }}><Heart size={28} fill="currentColor" /></div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-strong)", margin: "0 0 6px" }}>Thank you! 💜</h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 20px" }}>Your feedback means a lot and helps us make MindSpace better.</p>
            <button onClick={() => setOpen(false)} style={{ padding: "11px 22px", borderRadius: "11px", border: "none", background: "#534AB7", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Close</button>
          </div>
        ) : (
          <div style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "18px" }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setStars(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", lineHeight: 0 }}
                  title={`${n} star${n > 1 ? "s" : ""}`}
                >
                  <Star size={34} strokeWidth={1.5}
                    style={{ color: n <= shown ? "#f5b301" : "var(--text-dim)", transition: "color 0.12s" }}
                    fill={n <= shown ? "#f5b301" : "none"} />
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us what you think (optional)…"
              rows={3}
              style={{ width: "100%", boxSizing: "border-box", padding: "11px 13px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--card-2)", color: "var(--text)", fontSize: "13px", outline: "none", resize: "vertical" }}
            />

            {error && <p style={{ fontSize: "12px", color: "#f0a07a", margin: "10px 0 0" }}>⚠️ {error}</p>}

            <button
              onClick={submit}
              disabled={saving}
              style={{ width: "100%", marginTop: "16px", padding: "13px", borderRadius: "12px", border: "none", background: "#534AB7", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}
            >
              {saving ? "Submitting…" : "Submit rating"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
