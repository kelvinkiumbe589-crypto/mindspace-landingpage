import { useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ShieldCheck, CheckCircle2, Mail, Video, MapPin, Star, Clock, Smartphone, CreditCard, Building2 } from "lucide-react";

import { API_BASE } from "../lib/api";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TIME_SLOTS = ["08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

// Upcoming days the therapist works. allowedDays = JS getDay() ints (0=Sun..6=Sat).
function availableDays(allowedDays, count) {
  const out = [];
  const base = new Date();
  for (let i = 0; i < 45 && out.length < count; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    if (allowedDays.length && !allowedDays.includes(d.getDay())) continue;
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    out.push({
      value,
      dow: i === 0 ? "Today" : d.toLocaleDateString([], { weekday: "short" }),
      day: d.getDate(),
      month: d.toLocaleDateString([], { month: "short" }),
    });
  }
  return out;
}

function fmt12(t) {
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, "0")} ${ap}`;
}

export default function Booking() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const therapist = state?.therapist;

  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem("mindspace_user") || "{}"); } catch (e) { return {}; }
  })();
  const token = () => localStorage.getItem("mindspace_token");

  const [email, setEmail] = useState(storedUser.email || "");
  const [phone, setPhone] = useState("+254 ");
  const [fullName, setFullName] = useState(storedUser.name || "");
  const [sessionType, setSessionType] = useState("online");
  const [durationMinutes, setDurationMinutes] = useState(60); // online call length paid for
  const [payMethod, setPayMethod] = useState("mpesa"); // mpesa | card | bank
  const [sessionDate, setSessionDate] = useState("");
  const [sessionTime, setSessionTime] = useState("");
  const [status, setStatus] = useState("idle"); // idle | creating | checkout | done
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState("");
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const bookingIdRef = useRef(null);

  const allowedDays = therapist?.availableDays?.length ? therapist.availableDays : [1, 2, 3, 4, 5];
  const slots = therapist?.availableSlots?.length ? therapist.availableSlots : TIME_SLOTS;
  const days = availableDays(allowedDays, 14);

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

  const onlineRate = Number(therapist.priceOnline) || 2000; // per hour
  const onlineAmount = Math.round(onlineRate * (durationMinutes / 60));
  const physicalAmount = Number(therapist.pricePhysical) || Math.round(onlineRate * 1.5);
  const amountKes = sessionType === "physical" ? physicalAmount : onlineAmount;
  const sessionLabel = sessionType === "physical" ? "In-person" : "Online";
  const payLabel = payMethod === "card" ? "Card" : payMethod === "bank" ? "Bank" : "M-Pesa";

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canPay = isValidEmail && phone.replace(/\D/g, "").length >= 12 && sessionDate && sessionTime;
  const scheduledAt = sessionDate && sessionTime ? `${sessionDate}T${sessionTime}` : null;
  const scheduledLabel = scheduledAt ? new Date(scheduledAt).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "";

  const pollStatus = async (trackingId) => {
    for (let i = 0; i < 60; i++) {
      await sleep(5000);
      try {
        const res = await fetch(`${API_BASE}/api/payments/pesapal/status?orderTrackingId=${encodeURIComponent(trackingId)}`);
        const d = await res.json();
        const s = String(d.paymentStatus || "").toUpperCase();
        if (s === "COMPLETED") return "success";
        if (s === "FAILED" || s === "REVERSED") return d.paymentStatus || "Payment was not completed.";
      } catch (e) {}
    }
    return "timeout";
  };

  const markBooking = async (id, action, body) => {
    try {
      await fetch(`${API_BASE}/api/bookings/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e) {}
  };

  // The backend can be asleep (free tier) and take a while to wake — retry a few
  // times on network errors / gateway errors instead of failing immediately.
  const fetchRetry = async (url, opts, retries = 3) => {
    for (let attempt = 0; ; attempt++) {
      try {
        const res = await fetch(url, opts);
        if ([502, 503, 504].includes(res.status) && attempt < retries) {
          setStatusMsg("Waking up the server… one moment");
          await sleep(5000);
          continue;
        }
        return res;
      } catch (e) {
        if (attempt < retries) {
          setStatusMsg("Waking up the server… one moment");
          await sleep(5000);
          continue;
        }
        throw e;
      }
    }
  };

  const handlePay = async () => {
    if (!canPay || status === "creating") return;
    if (!token()) { setError("Please sign in again to book a session."); return; }
    setError("");
    setStatus("creating");
    setStatusMsg("Reserving your session…");
    try {
      // 1. Create the booking (amount is computed server-side)
      const bres = await fetchRetry(`${API_BASE}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ therapistId: therapist.userId, sessionType: sessionType.toUpperCase(), scheduledAt, phone, durationMinutes: sessionType === "online" ? durationMinutes : undefined }),
      });
      const booking = await bres.json();
      if (!bres.ok || !booking.id) {
        setStatus("idle"); setStatusMsg("");
        setError(booking.error || "Could not create the booking. Please sign in and try again.");
        return;
      }
      bookingIdRef.current = booking.id;

      // 2. Start Pesapal checkout
      setStatusMsg("Starting secure Pesapal checkout…");
      const parts = fullName.trim().split(/\s+/);
      const ores = await fetchRetry(`${API_BASE}/api/payments/pesapal/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountKes,
          description: `MindSpace ${sessionLabel} session with ${therapist.name}`,
          email, phone, firstName: parts[0] || "", lastName: parts.slice(1).join(" ") || "",
        }),
      });
      const order = await ores.json();
      if (!ores.ok || !order.redirectUrl) {
        await markBooking(booking.id, "failed");
        setStatus("idle"); setStatusMsg("");
        setError(order.error || "Could not start the checkout. Please try again.");
        return;
      }
      // Link the tracking id to the booking now, before the user pays, so the
      // server-side Pesapal IPN can confirm it even if this tab is closed.
      await markBooking(booking.id, "attach-order", { orderTrackingId: order.orderTrackingId });
      setCheckoutUrl(order.redirectUrl);
      setStatus("checkout");
      const result = await pollStatus(order.orderTrackingId);
      if (result === "success") {
        await markBooking(booking.id, "paid", { orderTrackingId: order.orderTrackingId });
        setStatus("done");
      } else if (result === "timeout") {
        setStatus("idle"); setCheckoutUrl("");
        setError("We couldn't confirm the payment yet. If you completed it, it may take a moment — check 'My sessions'.");
      } else {
        await markBooking(booking.id, "failed");
        setStatus("idle"); setCheckoutUrl("");
        setError(result);
      }
    } catch (e) {
      setStatus("idle"); setStatusMsg("");
      setError("We couldn't reach the server just now — it may have been waking up. Please try again in a moment.");
    }
  };

  // ── Embedded Pesapal checkout ──
  if (status === "checkout" && checkoutUrl) {
    return (
      <div style={wrap}>
        <div style={{ width: "100%", maxWidth: "560px" }}>
          <button onClick={() => { setStatus("idle"); setCheckoutUrl(""); }} style={backBtn}><ArrowLeft size={16} /> Cancel payment</button>
          <div style={{ ...card, padding: "0", overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "10px" }}>
              <ShieldCheck size={18} style={{ color: "#1D9E75" }} />
              <div>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-strong)", margin: 0 }}>Secure Pesapal checkout</p>
                <p style={{ fontSize: "12px", color: "var(--text-dim)", margin: 0 }}>Pay KES {amountKes.toLocaleString()} ({sessionLabel}) — choose {payLabel} to finish</p>
              </div>
            </div>
            <iframe title="Pesapal checkout" src={checkoutUrl} style={{ width: "100%", height: "560px", border: "none", display: "block", background: "#fff" }} />
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-dim)", textAlign: "center", marginTop: "12px" }}>Complete the payment above — this page confirms automatically. Keep it open.</p>
        </div>
      </div>
    );
  }

  if (status === "creating") {
    return (
      <div style={wrap}>
        <div style={{ ...card, maxWidth: "440px", textAlign: "center" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "50%", border: "4px solid var(--border)", borderTopColor: "#534AB7", margin: "0 auto 22px", animation: "spin 1s linear infinite" }} />
          <h1 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text-strong)", margin: "0 0 8px" }}>Just a moment…</h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>{statusMsg || "Please wait."}</p>
        </div>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div style={wrap}>
        <div style={{ ...card, maxWidth: "540px" }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(29,158,117,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: "#1D9E75" }}><CheckCircle2 size={30} /></div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-strong)", margin: "0 0 6px" }}>Payment received!</h1>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Your {sessionLabel.toLowerCase()} session with {therapist.name}{scheduledLabel ? ` for ${scheduledLabel}` : ""} is booked. KES {amountKes.toLocaleString()} paid via Pesapal.</p>
          </div>

          <div style={{ background: "rgba(83,74,183,0.1)", border: "1px solid var(--border)", borderRadius: "14px", padding: "18px", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-soft)", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}><Clock size={15} /> Awaiting therapist approval</div>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>{therapist.name} will confirm your session shortly. You'll see it move to <b>Upcoming</b> under “My sessions”, and to <b>Done</b> after the session.</p>
          </div>

          {therapist.email && (
            <div style={{ background: "var(--card-2)", border: "1px solid var(--border)", borderRadius: "14px", padding: "16px", marginBottom: "22px" }}>
              <p style={{ fontSize: "12px", color: "var(--text-dim)", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Your therapist</p>
              <a href={`mailto:${therapist.email}`} style={contactRow}><Mail size={16} /> {therapist.email}</a>
            </div>
          )}

          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={() => navigate("/find-a-therapist")} style={{ ...secondaryBtn, flex: 1 }}>My sessions</button>
            <button onClick={() => navigate("/dashboard")} style={{ ...primaryBtn, flex: 1 }}>Go to dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Booking screen ──
  return (
    <div style={wrap}>
      <div style={{ width: "100%", maxWidth: "560px" }}>
        <button onClick={() => navigate("/find-a-therapist")} style={backBtn}><ArrowLeft size={16} /> Back to therapists</button>

        <div style={card}>
          {/* Therapist summary */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", paddingBottom: "20px", borderBottom: "1px solid var(--border)", marginBottom: "20px" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: therapist.color || "#534AB7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>{therapist.initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-strong)", margin: 0 }}>{therapist.name}</h1>
              <p style={{ fontSize: "12px", color: "var(--text-dim)", margin: "2px 0 0" }}>{therapist.title}</p>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "12px", color: "#e0a458" }}><Star size={12} fill="currentColor" /> {therapist.rating}</span>
              </div>
            </div>
          </div>

          {/* Session type */}
          <h2 style={sectionH}>Session type</h2>
          <div style={{ display: "flex", gap: "10px", marginBottom: "22px" }}>
            <button onClick={() => setSessionType("online")} style={sessionCard(sessionType === "online")}>
              <Video size={20} /><span style={{ fontWeight: 600 }}>Online</span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-strong)" }}>KES {onlineRate.toLocaleString()}/hr</span>
              <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Video call · you pick the length</span>
            </button>
            <button onClick={() => setSessionType("physical")} style={sessionCard(sessionType === "physical")}>
              <MapPin size={20} /><span style={{ fontWeight: 600 }}>In-person</span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-strong)" }}>KES {physicalAmount.toLocaleString()}</span>
              <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>At the clinic · 1 hour</span>
            </button>
          </div>

          {/* Call length (online only) — drives the price. */}
          {sessionType === "online" && (
            <>
              <h2 style={sectionH}>How long do you want the call?</h2>
              <div style={{ display: "flex", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
                {[{ m: 30, l: "30 min" }, { m: 60, l: "1 hour" }, { m: 90, l: "1h 30m" }, { m: 120, l: "2 hours" }].map(({ m, l }) => {
                  const on = durationMinutes === m;
                  return (
                    <button key={m} onClick={() => setDurationMinutes(m)} style={{
                      flex: "1 0 auto", minWidth: "84px", padding: "12px 10px", borderRadius: "12px", cursor: "pointer",
                      background: on ? "rgba(83,74,183,0.15)" : "var(--card-2)", border: on ? "2px solid #534AB7" : "1px solid var(--border)",
                      color: on ? "var(--accent-soft)" : "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
                    }}>
                      <span style={{ fontSize: "13px", fontWeight: 700 }}>{l}</span>
                      <span style={{ fontSize: "11px", opacity: 0.8 }}>KES {Math.round(onlineRate * (m / 60)).toLocaleString()}</span>
                    </button>
                  );
                })}
              </div>
              <p style={{ fontSize: "11px", color: "var(--text-dim)", margin: "0 0 22px" }}>
                You can hang up and rejoin as many times as you like — you're only billed for time actually on the call, up to {durationMinutes >= 60 ? `${Math.floor(durationMinutes / 60)}h${durationMinutes % 60 ? " 30m" : ""}` : `${durationMinutes} min`}.
              </p>
            </>
          )}

          {/* Date */}
          <h2 style={sectionH}>Pick a day</h2>
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "6px", marginBottom: "18px" }}>
            {days.map((d) => {
              const on = sessionDate === d.value;
              return (
                <button key={d.value} onClick={() => setSessionDate(d.value)} style={{
                  flex: "0 0 auto", width: "58px", padding: "10px 0", borderRadius: "12px", cursor: "pointer",
                  background: on ? "#534AB7" : "var(--card-2)", border: on ? "2px solid #534AB7" : "1px solid var(--border)",
                  color: on ? "#fff" : "var(--text-soft)", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
                }}>
                  <span style={{ fontSize: "11px", opacity: 0.8 }}>{d.dow}</span>
                  <span style={{ fontSize: "18px", fontWeight: 700 }}>{d.day}</span>
                  <span style={{ fontSize: "10px", opacity: 0.7 }}>{d.month}</span>
                </button>
              );
            })}
          </div>

          {/* Time */}
          <h2 style={sectionH}>Pick a time</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "22px" }}>
            {slots.map((t) => {
              const on = sessionTime === t;
              return (
                <button key={t} onClick={() => setSessionTime(t)} style={{
                  padding: "9px 14px", borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: 600,
                  background: on ? "rgba(83,74,183,0.15)" : "var(--card-2)", border: on ? "2px solid #534AB7" : "1px solid var(--border)",
                  color: on ? "var(--accent-soft)" : "var(--text-muted)",
                }}>{fmt12(t)}</button>
              );
            })}
          </div>

          {/* Your details */}
          <h2 style={sectionH}>Your details</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
            <div><label style={label}>Full name</label><input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" style={input} /></div>
            <div><label style={label}>Email address</label><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" style={input} /></div>
            <div><label style={label}>Phone number</label><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254 7XX XXX XXX" style={input} /></div>
          </div>

          <h2 style={sectionH}>How would you like to pay?</h2>
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            {[{ k: "mpesa", label: "M-Pesa", Icon: Smartphone }, { k: "card", label: "Card", Icon: CreditCard }, { k: "bank", label: "Bank", Icon: Building2 }].map((m) => (
              <button key={m.k} onClick={() => setPayMethod(m.k)} style={sessionCard(payMethod === m.k)}>
                <m.Icon size={20} />
                <span style={{ fontWeight: 600 }}>{m.label}</span>
              </button>
            ))}
          </div>

          {error && <div style={{ background: "rgba(216,90,48,0.12)", border: "1px solid rgba(216,90,48,0.3)", borderRadius: "10px", padding: "12px 14px", marginBottom: "14px", fontSize: "13px", color: "#f0a07a" }}>⚠️ {error}</div>}

          <button onClick={handlePay} disabled={!canPay} style={{ ...primaryBtn, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: canPay ? 1 : 0.5, cursor: canPay ? "pointer" : "not-allowed" }}>
            <ShieldCheck size={16} /> Pay KES {amountKes.toLocaleString()} with {payLabel}
          </button>
          <p style={{ fontSize: "11px", color: "var(--text-dim)", textAlign: "center", marginTop: "12px" }}>🔒 Secured by Pesapal — pick {payLabel} on the next screen to complete.</p>
        </div>
      </div>
    </div>
  );
}

const wrap = { minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" };
const card = { width: "100%", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "18px", padding: "28px" };
const backBtn = { display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "var(--text-muted)", fontSize: "13px", cursor: "pointer", marginBottom: "16px" };
const sectionH = { fontSize: "15px", fontWeight: 600, color: "var(--text-strong)", margin: "0 0 12px" };
const label = { display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" };
const input = { width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--card-2)", color: "var(--text)", fontSize: "13px", outline: "none", boxSizing: "border-box" };
const primaryBtn = { padding: "13px 22px", borderRadius: "12px", border: "none", background: "#534AB7", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer" };
const secondaryBtn = { padding: "13px 22px", borderRadius: "12px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: "14px", fontWeight: 600, cursor: "pointer" };
const contactRow = { display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "var(--accent-soft)", textDecoration: "none" };
const sessionCard = (active) => ({ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", padding: "16px 12px", borderRadius: "12px", cursor: "pointer", fontSize: "13px", background: active ? "rgba(83,74,183,0.15)" : "var(--card-2)", border: active ? "2px solid #534AB7" : "1px solid var(--border)", color: active ? "var(--accent-soft)" : "var(--text-muted)" });
