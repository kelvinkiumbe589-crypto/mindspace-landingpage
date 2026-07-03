import { useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Phone,
  Video,
  MapPin,
  Star,
} from "lucide-react";
import { addBooking, updateBooking, slimTherapist } from "../bookings";

const API_BASE = "http://localhost:8080";
const sessionIcon = { video: Video, "in-person": MapPin, phone: Phone };

// In-person sessions cost 1.5x the online price.
const PHYSICAL_MULTIPLIER = 1.5;

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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Booking() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const therapist = state?.therapist;
  const resume = state?.resume; // continuing a pending/failed booking

  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem("mindspace_user") || "{}"); } catch (e) { return {}; }
  })();

  // Which session types this therapist offers (phone retired — online/physical only)
  const hasOnline = !therapist || (therapist.sessionTypes || []).includes("video");
  const hasPhysical = !!therapist && (therapist.sessionTypes || []).includes("in-person");
  const defaultType = resume?.sessionType || (hasOnline ? "online" : "physical");

  const [email, setEmail] = useState(storedUser.email || "");
  const [phone, setPhone] = useState("+254 ");
  const [fullName, setFullName] = useState(storedUser.name || "");
  const [sessionType, setSessionType] = useState(defaultType);
  const [status, setStatus] = useState("idle"); // idle | creating | checkout | done
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState("");
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const trackingRef = useRef(null);
  const bookingIdRef = useRef(resume?.id || null); // reuse the row when continuing

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
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canPay = isValidEmail && phone.replace(/\D/g, "").length >= 12;

  const onlineAmount = parseInt(String(therapist.price).replace(/[^0-9]/g, ""), 10) || 1;
  const physicalAmount = Math.round(onlineAmount * PHYSICAL_MULTIPLIER);
  const amountKes = sessionType === "physical" ? physicalAmount : onlineAmount;
  const sessionLabel = sessionType === "physical" ? "In-person" : "Online";

  // Poll Pesapal for the final status. Only COMPLETED is success; FAILED/REVERSED
  // are terminal failures; anything else (pending/invalid-yet-unpaid) keeps polling.
  const pollStatus = async (trackingId) => {
    for (let i = 0; i < 60; i++) {
      await sleep(5000);
      try {
        const res = await fetch(`${API_BASE}/api/payments/pesapal/status?orderTrackingId=${encodeURIComponent(trackingId)}`);
        const d = await res.json();
        const s = String(d.paymentStatus || "").toUpperCase();
        if (s === "COMPLETED") return "success";
        if (s === "FAILED" || s === "REVERSED") return d.paymentStatus || "Payment was not completed.";
      } catch (e) {
        // network hiccup — keep polling
      }
    }
    return "timeout";
  };

  // Create or update the booking row that tracks this attempt.
  const persistPending = () => {
    const payload = {
      therapist: slimTherapist(therapist),
      sessionType,
      sessionLabel,
      amount: amountKes,
      status: "pending",
    };
    if (bookingIdRef.current) {
      updateBooking(bookingIdRef.current, payload);
    } else {
      bookingIdRef.current = addBooking(payload).id;
    }
  };

  const handlePay = async () => {
    if (!canPay || status === "creating") return;
    setError("");
    setStatus("creating");
    setStatusMsg("Starting secure Pesapal checkout…");
    persistPending();
    const parts = fullName.trim().split(/\s+/);
    try {
      const res = await fetch(`${API_BASE}/api/payments/pesapal/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountKes,
          description: `MindSpace ${sessionLabel} session with ${therapist.name}`,
          email,
          phone,
          firstName: parts[0] || "",
          lastName: parts.slice(1).join(" ") || "",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.redirectUrl) {
        updateBooking(bookingIdRef.current, { status: "failed" });
        setStatus("idle");
        setStatusMsg("");
        setError(data.error || "Could not start the checkout. Please try again.");
        return;
      }
      trackingRef.current = data.orderTrackingId;
      updateBooking(bookingIdRef.current, { orderTrackingId: data.orderTrackingId });
      setCheckoutUrl(data.redirectUrl);
      setStatus("checkout");
      const result = await pollStatus(data.orderTrackingId);
      if (result === "success") {
        updateBooking(bookingIdRef.current, { status: "completed" });
        setStatus("done");
      } else if (result === "timeout") {
        // leave as pending — payment may still land; user can continue later
        setStatus("idle");
        setCheckoutUrl("");
        setError("We couldn't confirm the payment yet. If you completed it, it may take a moment — check your email for a receipt. This session is saved under 'My sessions' so you can continue.");
      } else {
        updateBooking(bookingIdRef.current, { status: "failed" });
        setStatus("idle");
        setCheckoutUrl("");
        setError(result);
      }
    } catch (e) {
      updateBooking(bookingIdRef.current, { status: "failed" });
      setStatus("idle");
      setStatusMsg("");
      setError("Could not reach the server. Make sure the backend is running on port 8080.");
    }
  };

  // ── Embedded Pesapal checkout ──
  if (status === "checkout" && checkoutUrl) {
    return (
      <div style={wrap}>
        <div style={{ width: "100%", maxWidth: "560px" }}>
          <button onClick={() => { setStatus("idle"); setCheckoutUrl(""); }} style={backBtn}>
            <ArrowLeft size={16} /> Cancel payment
          </button>
          <div style={{ ...card, padding: "0", overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "10px" }}>
              <ShieldCheck size={18} style={{ color: "#1D9E75" }} />
              <div>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-strong)", margin: 0 }}>Secure Pesapal checkout</p>
                <p style={{ fontSize: "12px", color: "var(--text-dim)", margin: 0 }}>Pay KES {amountKes.toLocaleString()} ({sessionLabel}) via M-Pesa, card, or bank</p>
              </div>
            </div>
            <iframe
              title="Pesapal checkout"
              src={checkoutUrl}
              style={{ width: "100%", height: "560px", border: "none", display: "block", background: "#fff" }}
            />
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-dim)", textAlign: "center", marginTop: "12px" }}>
            Complete the payment above — this page will confirm automatically. Keep it open.
          </p>
        </div>
      </div>
    );
  }

  // ── Creating order ──
  if (status === "creating") {
    return (
      <div style={wrap}>
        <div style={{ ...card, maxWidth: "440px", textAlign: "center" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "50%", border: "4px solid var(--border)", borderTopColor: "#534AB7", margin: "0 auto 22px", animation: "spin 1s linear infinite" }} />
          <h1 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text-strong)", margin: "0 0 8px" }}>Starting checkout…</h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>{statusMsg || "Please wait a moment."}</p>
        </div>
      </div>
    );
  }

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
              Your {sessionLabel.toLowerCase()} session with {therapist.name} is reserved. Payment of KES {amountKes.toLocaleString()} received via Pesapal.
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
              <li>A receipt for {therapist.price} has been sent to your email by Pesapal.</li>
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
        <button onClick={() => navigate("/find-a-therapist")} style={backBtn}>
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

          <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-strong)", margin: "0 0 12px" }}>Session type</h2>
          <div style={{ display: "flex", gap: "10px", marginBottom: "22px" }}>
            {hasOnline && (
              <button onClick={() => setSessionType("online")} style={sessionCard(sessionType === "online")}>
                <Video size={20} />
                <span style={{ fontWeight: 600 }}>Online</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-strong)" }}>KES {onlineAmount.toLocaleString()}</span>
                <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Video call</span>
              </button>
            )}
            {hasPhysical && (
              <button onClick={() => setSessionType("physical")} style={sessionCard(sessionType === "physical")}>
                <MapPin size={20} />
                <span style={{ fontWeight: 600 }}>In-person</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-strong)" }}>KES {physicalAmount.toLocaleString()}</span>
                <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>At the clinic</span>
              </button>
            )}
          </div>

          <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-strong)", margin: "0 0 4px" }}>Your details</h2>
          <p style={{ fontSize: "12px", color: "var(--text-dim)", margin: "0 0 16px" }}>Pesapal sends your receipt here and lets you pay by M-Pesa, card, or bank.</p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "22px" }}>
            <div>
              <label style={label}>Full name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" style={input} />
            </div>
            <div>
              <label style={label}>Email address</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" style={input} />
            </div>
            <div>
              <label style={label}>Phone number</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254 7XX XXX XXX" style={input} />
            </div>
          </div>

          {error && (
            <div style={{ background: "rgba(216,90,48,0.12)", border: "1px solid rgba(216,90,48,0.3)", borderRadius: "10px", padding: "12px 14px", marginBottom: "14px", fontSize: "13px", color: "#f0a07a" }}>
              ⚠️ {error}
            </div>
          )}

          <button onClick={handlePay} disabled={!canPay} style={{ ...primaryBtn, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: canPay ? 1 : 0.5, cursor: canPay ? "pointer" : "not-allowed" }}>
            <ShieldCheck size={16} /> Pay KES {amountKes.toLocaleString()} ({sessionLabel}) with Pesapal
          </button>
          <p style={{ fontSize: "11px", color: "var(--text-dim)", textAlign: "center", marginTop: "12px" }}>
            🔒 Secured by Pesapal — M-Pesa, Visa, Mastercard & bank supported.
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
const backBtn = {
  display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none",
  color: "var(--text-muted)", fontSize: "13px", cursor: "pointer", marginBottom: "16px",
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
const sessionCard = (active) => ({
  flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
  padding: "16px 12px", borderRadius: "12px", cursor: "pointer", fontSize: "13px",
  background: active ? "rgba(83,74,183,0.15)" : "var(--card-2)",
  border: active ? "2px solid #534AB7" : "1px solid var(--border)",
  color: active ? "var(--accent-soft)" : "var(--text-muted)",
});
