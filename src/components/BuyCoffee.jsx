import { useEffect, useRef, useState } from "react";
import { X, Coffee, Heart, Smartphone, CreditCard, Building2 } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";
const PRESETS = [100, 250, 500, 1000];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function BuyCoffee() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState("form"); // form | checkout | done
  const [amount, setAmount] = useState(250);
  const [payMethod, setPayMethod] = useState("mpesa"); // mpesa | card | bank
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const tipRef = useRef(null);

  useEffect(() => {
    const openHandler = () => { setOpen(true); setStep("form"); setError(""); };
    window.addEventListener("mindspace:open-coffee", openHandler);
    return () => window.removeEventListener("mindspace:open-coffee", openHandler);
  }, []);

  const storedEmail = (() => {
    try { return JSON.parse(localStorage.getItem("mindspace_user") || "{}").email || ""; } catch (e) { return ""; }
  })();

  const pollStatus = async (trackingId) => {
    for (let i = 0; i < 60; i++) {
      await sleep(5000);
      try {
        const res = await fetch(`${API_BASE}/api/payments/pesapal/status?orderTrackingId=${encodeURIComponent(trackingId)}`);
        const d = await res.json();
        const s = String(d.paymentStatus || "").toUpperCase();
        if (s === "COMPLETED") return "success";
        if (s === "FAILED" || s === "REVERSED") return "failed";
      } catch (e) {}
    }
    return "timeout";
  };

  const support = async () => {
    const amt = Number(amount) || 0;
    if (amt <= 0) { setError("Choose or enter an amount."); return; }
    if (loading) return;
    setLoading(true); setError("");
    try {
      // 1. record the pending tip
      const tres = await fetch(`${API_BASE}/api/tips`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, name: name.trim(), message: message.trim() }),
      });
      const tip = await tres.json();
      if (!tres.ok || !tip.id) { setError(tip.error || "Couldn't start. Try again."); setLoading(false); return; }
      tipRef.current = tip.id;

      // 2. Pesapal checkout
      const ores = await fetch(`${API_BASE}/api/payments/pesapal/order`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, description: "Buy MindSpace a coffee ☕", email: storedEmail || "supporter@mindspace.co.ke", phone: "", firstName: name.trim() || "Supporter", lastName: "" }),
      });
      const order = await ores.json();
      if (!ores.ok || !order.redirectUrl) { setError(order.error || "Couldn't start the checkout."); setLoading(false); return; }
      setCheckoutUrl(order.redirectUrl);
      setStep("checkout");
      setLoading(false);
      const result = await pollStatus(order.orderTrackingId);
      if (result === "success") {
        await fetch(`${API_BASE}/api/tips/${tip.id}/paid`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderTrackingId: order.orderTrackingId }),
        });
        setStep("done");
      } else {
        setStep("form"); setCheckoutUrl("");
        setError(result === "timeout" ? "We couldn't confirm it yet — if you paid, thank you! It'll reflect shortly." : "Payment wasn't completed.");
      }
    } catch (e) {
      setError("Could not reach the server. Please try again in a moment."); setLoading(false);
    }
  };

  if (!open) return null;

  const payLabel = payMethod === "card" ? "Card" : payMethod === "bank" ? "Bank" : "M-Pesa";
  const close = () => { setOpen(false); setStep("form"); setCheckoutUrl(""); setError(""); };

  return (
    <div onClick={close} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: step === "checkout" ? "460px" : "400px", background: "var(--elevated)", border: "1px solid var(--border)", borderRadius: "20px", overflow: "hidden", boxShadow: "0 30px 70px rgba(0,0,0,0.5)" }}>
        {/* Header */}
        <div style={{ position: "relative", padding: "22px", background: "linear-gradient(135deg, #7a5230, #b07a3f)", color: "#fff" }}>
          <button onClick={close} style={{ position: "absolute", top: "14px", right: "14px", background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", width: "28px", height: "28px", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}><Coffee size={22} /></div>
            <div>
              <p style={{ fontSize: "17px", fontWeight: 700, margin: 0 }}>Buy us a coffee</p>
              <p style={{ fontSize: "12px", opacity: 0.85, margin: 0 }}>Support MindSpace — keep it free & growing</p>
            </div>
          </div>
        </div>

        {step === "form" && (
          <div style={{ padding: "22px" }}>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 8px" }}>Choose an amount (KES)</p>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              {PRESETS.map((p) => (
                <button key={p} onClick={() => setAmount(p)} style={{ flex: 1, padding: "12px 0", borderRadius: "10px", cursor: "pointer", fontSize: "14px", fontWeight: 700, background: Number(amount) === p ? "#b07a3f" : "var(--card-2)", border: Number(amount) === p ? "2px solid #b07a3f" : "1px solid var(--border)", color: Number(amount) === p ? "#fff" : "var(--text-soft)" }}>{p}</button>
              ))}
            </div>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Custom amount" style={inp} />
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)" style={{ ...inp, marginTop: "10px" }} />
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Say something nice (optional)" style={{ ...inp, marginTop: "10px", minHeight: "56px", resize: "vertical" }} />

            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "14px 0 8px" }}>Pay with</p>
            <div style={{ display: "flex", gap: "8px" }}>
              {[{ k: "mpesa", label: "M-Pesa", Icon: Smartphone }, { k: "card", label: "Card", Icon: CreditCard }, { k: "bank", label: "Bank", Icon: Building2 }].map((m) => {
                const on = payMethod === m.k;
                return (
                  <button key={m.k} onClick={() => setPayMethod(m.k)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", padding: "10px 6px", borderRadius: "10px", cursor: "pointer", fontSize: "12px", fontWeight: 600, background: on ? "rgba(176,122,63,0.15)" : "var(--card-2)", border: on ? "2px solid #b07a3f" : "1px solid var(--border)", color: on ? "#c98a4b" : "var(--text-muted)" }}>
                    <m.Icon size={18} /> {m.label}
                  </button>
                );
              })}
            </div>

            {error && <p style={{ fontSize: "12px", color: "#f0a07a", margin: "10px 0 0" }}>⚠️ {error}</p>}
            <button onClick={support} disabled={loading} style={{ width: "100%", marginTop: "16px", padding: "13px", borderRadius: "12px", border: "none", background: "#b07a3f", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <Coffee size={16} /> {loading ? "Starting…" : `Support KES ${(Number(amount) || 0).toLocaleString()} with ${payLabel}`}
            </button>
            <p style={{ fontSize: "11px", color: "var(--text-dim)", textAlign: "center", margin: "10px 0 0" }}>🔒 Secured by Pesapal — pick {payLabel} on the next screen</p>
          </div>
        )}

        {step === "checkout" && checkoutUrl && (
          <div>
            <iframe title="Pesapal checkout" src={checkoutUrl} style={{ width: "100%", height: "520px", border: "none", display: "block", background: "#fff" }} />
            <p style={{ fontSize: "12px", color: "var(--text-dim)", textAlign: "center", padding: "12px" }}>Complete the payment above — this closes automatically. Thank you! ☕</p>
          </div>
        )}

        {step === "done" && (
          <div style={{ padding: "34px 24px", textAlign: "center" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(176,122,63,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: "#b07a3f" }}><Heart size={28} fill="currentColor" /></div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-strong)", margin: "0 0 6px" }}>Thank you! ☕</h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 20px" }}>Your support keeps MindSpace going. It means a lot.</p>
            <button onClick={close} style={{ padding: "11px 22px", borderRadius: "11px", border: "none", background: "#b07a3f", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

const inp = { width: "100%", padding: "11px 13px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--card-2)", color: "var(--text)", fontSize: "13px", outline: "none", boxSizing: "border-box" };
