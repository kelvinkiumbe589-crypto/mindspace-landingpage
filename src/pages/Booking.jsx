import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Smartphone,
  CreditCard,
  Building2,
  CheckCircle2,
  Mail,
  Phone,
  Video,
  MapPin,
  Star,
} from "lucide-react";

const sessionIcon = { video: Video, "in-person": MapPin, phone: Phone };

// Deterministic demo contact details derived from the therapist
function contactFor(t) {
  const slug = t.name
    .toLowerCase()
    .replace(/,.*$/, "")
    .replace(/[^a-z\s]/g, "")
    .trim()
    .replace(/\s+/g, ".");
  return {
    email: `${slug}@mindspace.co.ke`,
    phone: `+254 7${String(10 + t.id)} ${String(100 + t.id * 13).slice(0, 3)} ${String(100 + t.id * 29).slice(0, 3)}`,
  };
}

export default function Booking() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const therapist = state?.therapist;

  const [method, setMethod] = useState("mpesa");
  const [mpesaPhone, setMpesaPhone] = useState("+254 ");
  const [cardForm, setCardForm] = useState({ number: "", expiry: "", cvc: "", name: "" });
  const [bankConfirmed, setBankConfirmed] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | processing | done

  // Direct navigation without a selected therapist
  if (!therapist) {
    return (
      <div style={wrap}>
        <div style={{ ...card, maxWidth: "440px", textAlign: "center" }}>
          <p style={{ fontSize: "34px", marginBottom: "10px" }}>🩺</p>
          <h1 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text-strong)", margin: "0 0 8px" }}>No therapist selected</h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>Choose a therapist to book a session with.</p>
          <button onClick={() => navigate("/find-a-therapist")} style={primaryBtn}>Browse therapists</button>
        </div>
      </div>
    );
  }

  const contact = contactFor(therapist);
  const canPay =
    (method === "mpesa" && mpesaPhone.replace(/\D/g, "").length >= 12) ||
    (method === "card" && cardForm.number.replace(/\s/g, "").length >= 12 && cardForm.expiry && cardForm.cvc) ||
    (method === "bank" && bankConfirmed);

  const handlePay = () => {
    if (!canPay || status === "processing") return;
    setStatus("processing");
    // Demo flow — no real charge. Simulate gateway/STK processing.
    setTimeout(() => setStatus("done"), 1600);
  };

  const methods = [
    { key: "mpesa", label: "M-Pesa", Icon: Smartphone },
    { key: "card", label: "Card", Icon: CreditCard },
    { key: "bank", label: "Bank transfer", Icon: Building2 },
  ];

  // ── Confirmation screen ──
  if (status === "done") {
    return (
      <div style={wrap}>
        <div style={{ ...card, maxWidth: "540px" }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(29,158,117,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: "#1D9E75" }}>
              <CheckCircle2 size={30} />
            </div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-strong)", margin: "0 0 6px" }}>Booking confirmed!</h1>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Your session with {therapist.name} is reserved. Payment via {methods.find((m) => m.key === method).label} received.
            </p>
          </div>

          <div style={{ background: "var(--card-2)", border: "1px solid var(--border)", borderRadius: "14px", padding: "18px", marginBottom: "16px" }}>
            <p style={{ fontSize: "12px", color: "var(--text-dim)", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Your therapist's contact</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <a href={`mailto:${contact.email}`} style={contactRow}><Mail size={16} /> {contact.email}</a>
              <a href={`tel:${contact.phone.replace(/\s/g, "")}`} style={contactRow}><Phone size={16} /> {contact.phone}</a>
            </div>
          </div>

          <div style={{ background: "rgba(83,74,183,0.1)", border: "1px solid var(--border)", borderRadius: "14px", padding: "18px", marginBottom: "22px" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-soft)", margin: "0 0 10px" }}>What happens next</p>
            <ol style={{ margin: 0, paddingLeft: "18px", color: "var(--text-muted)", fontSize: "13px", lineHeight: 1.9 }}>
              <li>{therapist.name} will email you within 24 hours to agree a time.</li>
              <li>You'll get a {therapist.sessionTypes?.[0] === "in-person" ? "location and directions" : "session link or call details"}.</li>
              <li>A receipt for {therapist.price} has been sent to your email.</li>
            </ol>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={() => navigate("/find-a-therapist")} style={{ ...secondaryBtn, flex: 1 }}>Back to therapists</button>
            <button onClick={() => navigate("/dashboard")} style={{ ...primaryBtn, flex: 1 }}>Go to dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Booking + payment screen ──
  return (
    <div style={wrap}>
      <div style={{ width: "100%", maxWidth: "560px" }}>
        <button onClick={() => navigate("/find-a-therapist")} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "var(--text-muted)", fontSize: "13px", cursor: "pointer", marginBottom: "16px" }}>
          <ArrowLeft size={16} /> Back to therapists
        </button>

        <div style={card}>
          {/* Therapist summary */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", paddingBottom: "20px", borderBottom: "1px solid var(--border)", marginBottom: "20px" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "#534AB7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              {therapist.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-strong)", margin: 0 }}>{therapist.name}</h1>
              <p style={{ fontSize: "12px", color: "var(--text-dim)", margin: "2px 0 0" }}>{therapist.title}</p>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "12px", color: "#e0a458" }}><Star size={12} fill="currentColor" /> {therapist.rating}</span>
                <span style={{ display: "flex", gap: "6px", color: "var(--text-dim)", marginLeft: "6px" }}>
                  {(therapist.sessionTypes || []).map((type) => {
                    const Icon = sessionIcon[type];
                    return Icon ? <Icon key={type} size={13} /> : null;
                  })}
                </span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "12px", color: "var(--text-dim)", margin: 0 }}>Session fee</p>
              <p style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-strong)", margin: 0 }}>{therapist.price}</p>
            </div>
          </div>

          <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-strong)", margin: "0 0 12px" }}>Choose a payment method</h2>
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            {methods.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setMethod(key)}
                style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
                  padding: "14px", borderRadius: "12px", cursor: "pointer", fontSize: "12px", fontWeight: 600,
                  background: method === key ? "rgba(83,74,183,0.15)" : "var(--card-2)",
                  border: method === key ? "2px solid #534AB7" : "1px solid var(--border)",
                  color: method === key ? "var(--accent-soft)" : "var(--text-muted)",
                }}
              >
                <Icon size={20} /> {label}
              </button>
            ))}
          </div>

          {/* Method-specific fields */}
          {method === "mpesa" && (
            <div style={{ marginBottom: "22px" }}>
              <label style={label}>M-Pesa phone number</label>
              <input value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)} placeholder="+254 7XX XXX XXX" style={input} />
              <p style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "8px" }}>You'll receive an STK push on your phone to authorise {therapist.price}.</p>
            </div>
          )}
          {method === "card" && (
            <div style={{ marginBottom: "22px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={label}>Card number</label>
                <input value={cardForm.number} onChange={(e) => setCardForm({ ...cardForm, number: e.target.value })} placeholder="1234 5678 9012 3456" style={input} />
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={label}>Expiry</label>
                  <input value={cardForm.expiry} onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })} placeholder="MM/YY" style={input} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={label}>CVC</label>
                  <input value={cardForm.cvc} onChange={(e) => setCardForm({ ...cardForm, cvc: e.target.value })} placeholder="123" style={input} />
                </div>
              </div>
              <div>
                <label style={label}>Name on card</label>
                <input value={cardForm.name} onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })} placeholder="Full name" style={input} />
              </div>
            </div>
          )}
          {method === "bank" && (
            <div style={{ marginBottom: "22px" }}>
              <div style={{ background: "var(--card-2)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px", fontSize: "13px", color: "var(--text-soft)", lineHeight: 2 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-dim)" }}>Bank</span> Equity Bank Kenya</div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-dim)" }}>Account name</span> MindSpace Ltd</div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-dim)" }}>Account no.</span> 0123456789012</div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-dim)" }}>Reference</span> MS-{therapist.id}{therapist.initials}</div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-dim)" }}>Amount</span> {therapist.price}</div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "14px", cursor: "pointer", fontSize: "13px", color: "var(--text-soft)" }}>
                <input type="checkbox" checked={bankConfirmed} onChange={(e) => setBankConfirmed(e.target.checked)} style={{ width: "16px", height: "16px", accentColor: "#534AB7" }} />
                I have made the transfer using the reference above
              </label>
            </div>
          )}

          <button onClick={handlePay} disabled={!canPay || status === "processing"} style={{ ...primaryBtn, width: "100%", opacity: canPay ? 1 : 0.5, cursor: canPay ? "pointer" : "not-allowed" }}>
            {status === "processing"
              ? "Processing…"
              : method === "bank"
              ? "Confirm booking"
              : `Pay ${therapist.price} & confirm`}
          </button>
          <p style={{ fontSize: "11px", color: "var(--text-dim)", textAlign: "center", marginTop: "12px" }}>
            🔒 This is a demo checkout — no real payment is charged.
          </p>
        </div>
      </div>
    </div>
  );
}

const wrap = {
  minHeight: "100vh", background: "var(--bg)", color: "var(--text)",
  fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center",
  justifyContent: "center", padding: "40px 20px",
};
const card = {
  width: "100%", background: "var(--card)", border: "1px solid var(--border)",
  borderRadius: "18px", padding: "28px",
};
const label = { display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" };
const input = {
  width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid var(--border)",
  background: "var(--card-2)", color: "var(--text)", fontSize: "13px", outline: "none", boxSizing: "border-box",
};
const primaryBtn = {
  padding: "13px 22px", borderRadius: "12px", border: "none", background: "#534AB7",
  color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer",
};
const secondaryBtn = {
  padding: "13px 22px", borderRadius: "12px", border: "1px solid var(--border)",
  background: "transparent", color: "var(--text-muted)", fontSize: "14px", fontWeight: 600, cursor: "pointer",
};
const contactRow = {
  display: "flex", alignItems: "center", gap: "10px", fontSize: "13px",
  color: "var(--accent-soft)", textDecoration: "none",
};
