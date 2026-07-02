import MoodTicker from "../components/MoodTicker";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:8080";
const SUPPORT_EMAIL = "kelvinkiumbe589@gmail.com";
const SUPPORT_PHONE = "+254757306837";
const SUPPORT_LOCATION = "Nairobi, Kenya";
const SUPPORT_HOURS = "Mon–Fri, 8am–6pm EAT";

export default function LandingPage() {
  const navigate = useNavigate();

  // Support form state
  const [sName, setSName] = useState("");
  const [sEmail, setSEmail] = useState("");
  const [sPhone, setSPhone] = useState("");
  const [sMsg, setSMsg] = useState("");
  const [sStatus, setSStatus] = useState(null); // null | "sending" | "sent" | "mailto"
  const [openFaq, setOpenFaq] = useState(0);

  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    if (!sName.trim() || !sEmail.trim() || !sMsg.trim()) return;
    setSStatus("sending");
    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: sName, email: sEmail, phone: sPhone, message: sMsg }),
      });
      if (res.ok) {
        setSStatus("sent");
        setSName(""); setSEmail(""); setSPhone(""); setSMsg("");
        return;
      }
      throw new Error("unavailable");
    } catch (err) {
      // Fallback: open the visitor's mail client pre-filled to the support inbox
      const subject = encodeURIComponent(`MindSpace support request from ${sName}`);
      const body = encodeURIComponent(`Name: ${sName}\nEmail: ${sEmail}\nPhone: ${sPhone}\n\n${sMsg}`);
      window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
      setSStatus("mailto");
    }
  };

  return (
    <div style={{ background: "#0d0d14", minHeight: "100vh", color: "#e8e6ff", fontFamily: "system-ui, sans-serif" }}>

      {/* ── TOP CONTACT BAR ── */}
      <div style={{
        background: "#4b43a3", color: "#fff", fontSize: "13px",
        padding: "9px 40px", display: "flex", justifyContent: "space-between",
        alignItems: "center", flexWrap: "wrap", gap: "10px",
      }}>
        <div style={{ display: "flex", gap: "22px", flexWrap: "wrap", alignItems: "center" }}>
          <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`} style={{ color: "#fff", textDecoration: "none", display: "flex", alignItems: "center", gap: "7px" }}>
            <span>📞</span> {SUPPORT_PHONE}
          </a>
          <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: "#fff", textDecoration: "none", display: "flex", alignItems: "center", gap: "7px" }}>
            <span>✉️</span> {SUPPORT_EMAIL}
          </a>
          <span style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <span>📍</span> {SUPPORT_LOCATION}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "7px", color: "rgba(255,255,255,0.85)" }}>
          <span>🕒</span> {SUPPORT_HOURS}
        </div>
      </div>

      {/* ── NAVBAR ── */}
      <nav style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "18px 40px",
        borderBottom: "1px solid rgba(127,119,221,0.15)",
        position: "sticky",
        top: 0,
        background: "rgba(13,13,20,0.9)",
        backdropFilter: "blur(12px)",
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "18px", fontWeight: 500 }}>
          <div style={{
            width: "32px", height: "32px", background: "#534AB7",
            borderRadius: "8px", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "16px",
          }}>🧠</div>
          MindSpace
        </div>
        <div style={{ display: "flex", gap: "32px", fontSize: "14px", color: "#9d9bc4" }}>
          {[
            { label: "Features", action: () => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" }) },
            { label: "How it works", action: () => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" }) },
            { label: "FAQ", action: () => document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" }) },
            { label: "Community", action: () => navigate("/community-forum") },
            { label: "Therapists", action: () => navigate("/find-a-therapist") },
          ].map(item => (
            <span key={item.label} onClick={item.action} style={{ cursor: "pointer" }}
              onMouseEnter={e => e.target.style.color = "#e8e6ff"}
              onMouseLeave={e => e.target.style.color = "#9d9bc4"}>
              {item.label}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={{
            padding: "8px 20px", borderRadius: "8px",
            border: "1px solid rgba(127,119,221,0.3)",
            background: "transparent", color: "#c4c1f0",
            fontSize: "14px", cursor: "pointer",
          }} onClick={() => navigate("/signin")}
          >Log in</button>
          <button 
          onClick={() => navigate("/signup")}
          style={{
            padding: "8px 20px", borderRadius: "8px",
            border: "none", background: "#534AB7",
            color: "#fff", fontSize: "14px", cursor: "pointer",
            fontWeight: 500,
          }}>Get started</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: "relative", textAlign: "center", padding: "80px 40px 0", overflow: "hidden" }}>

        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "6px 16px", borderRadius: "20px",
          border: "1px solid rgba(127,119,221,0.3)",
          background: "rgba(83,74,183,0.1)",
          fontSize: "13px", color: "#AFA9EC", marginBottom: "24px",
        }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#7F77DD", display: "inline-block" }} />
          AI-powered mental wellness for Africa
        </div>

        {/* Heading */}
        <h1 style={{
          fontSize: "clamp(36px, 6vw, 64px)",
          fontWeight: 500, lineHeight: 1.1,
          color: "#f0eeff", maxWidth: "700px",
          margin: "0 auto 20px",
        }}>
          Your mental health,{" "}
          <span style={{ color: "#7F77DD" }}>tracked and supported</span>
        </h1>

        {/* Subtext */}
        <p style={{
          fontSize: "16px", color: "#9d9bc4",
          maxWidth: "500px", margin: "0 auto 36px", lineHeight: 1.7,
        }}>
          Log moods daily, get AI wellness insights, connect anonymously with peers,
          and book licensed therapists — all in one safe space.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "60px" }}>
          <button 
           onClick={() => navigate("/signup")}
           style={{
            padding: "13px 32px", borderRadius: "10px",
            border: "none", background: "#534AB7",
            color: "#fff", fontSize: "15px",
            fontWeight: 500, cursor: "pointer",
          }}>Start for free</button>
          <button
            onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            style={{
            padding: "13px 32px", borderRadius: "10px",
            border: "1px solid rgba(127,119,221,0.3)",
            background: "transparent", color: "#c4c1f0",
            fontSize: "15px", cursor: "pointer",
          }}>See how it works ▶</button>
        </div>

        {/* 3D Marquee */}
      </section>

      {/* ── STATS ── */}
      <section style={{
        display: "flex", justifyContent: "center", gap: "60px",
        padding: "48px 40px",
        borderTop: "1px solid rgba(127,119,221,0.1)",
        borderBottom: "1px solid rgba(127,119,221,0.1)",
      }}>
        {[
          { num: "2,400+", label: "Active users" },
          { num: "18,000+", label: "Mood entries logged" },
          { num: "94%", label: "Feel more self-aware" },
          { num: "60+", label: "Licensed therapists" },
        ].map(({ num, label }) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: "28px", fontWeight: 500, color: "#c4c1f0" }}>{num}</div>
            <div style={{ fontSize: "13px", color: "#6b6990", marginTop: "4px" }}>{label}</div>
          </div>
        ))}
      </section>
<MoodTicker />
      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: "80px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div style={{ fontSize: "12px", color: "#7F77DD", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "10px" }}>Features</div>
          <h2 style={{ fontSize: "32px", fontWeight: 500, color: "#f0eeff", marginBottom: "10px" }}>Everything you need to feel better</h2>
          <p style={{ fontSize: "15px", color: "#9d9bc4" }}>Built for students, professionals, and anyone navigating life in Africa</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", maxWidth: "900px", margin: "0 auto" }}>
          {[
            { icon: "😊", title: "Daily mood journal", desc: "Log your mood score, tag emotions, and write journal entries. Build self-awareness over time.", color: "rgba(83,74,183,0.2)" },
            { icon: "🤖", title: "AI wellness insights", desc: "Personalized insights powered by Gemini AI that analyzes your mood patterns and offers practical tips.", color: "rgba(29,158,117,0.2)" },
            { icon: "👥", title: "Anonymous community", desc: "Share your story and read others anonymously. A judgment-free peer support forum.", color: "rgba(216,90,48,0.15)" },
            { icon: "📊", title: "Mood trend charts", desc: "Visual charts show your mood trends over days and weeks. Spot patterns and celebrate progress.", color: "rgba(83,74,183,0.2)" },
            { icon: "🩺", title: "Therapist directory", desc: "Browse licensed therapists by specialization and location. Book sessions directly.", color: "rgba(29,158,117,0.2)" },
            { icon: "🔒", title: "Private and secure", desc: "Your data is encrypted and private. Anonymous posting is built in.", color: "rgba(216,90,48,0.15)" },
          ].map(({ icon, title, desc, color }) => (
            <div key={title} style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(127,119,221,0.15)",
              borderRadius: "14px", padding: "24px",
            }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "10px",
                background: color, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "20px", marginBottom: "16px",
              }}>{icon}</div>
              <h3 style={{ fontSize: "15px", fontWeight: 500, color: "#e0deff", marginBottom: "8px" }}>{title}</h3>
              <p style={{ fontSize: "13px", color: "#7a7898", lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ padding: "80px 40px", borderTop: "1px solid rgba(127,119,221,0.1)" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div style={{ fontSize: "12px", color: "#7F77DD", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "10px" }}>How it works</div>
          <h2 style={{ fontSize: "32px", fontWeight: 500, color: "#f0eeff", marginBottom: "10px" }}>From feeling to understanding, in four steps</h2>
          <p style={{ fontSize: "15px", color: "#9d9bc4", maxWidth: "560px", margin: "0 auto" }}>
            MindSpace turns a few seconds of daily reflection into real insight about your mental wellbeing — and support whenever you need it.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", maxWidth: "1000px", margin: "0 auto" }}>
          {[
            { n: "1", icon: "📝", title: "Log how you feel", desc: "Take a few seconds each day to record your mood, tag the emotions behind it, and write what's on your mind — no pressure, just honesty." },
            { n: "2", icon: "✨", title: "Get AI insights", desc: "Our Gemini-powered assistant reads your entries and reflects back gentle, personalised insights and practical tips — like a friend who remembers." },
            { n: "3", icon: "📊", title: "See your patterns", desc: "Your entries become clear charts and trends, so you can spot what lifts you up, what wears you down, and how you're growing over time." },
            { n: "4", icon: "🤝", title: "Reach out for support", desc: "Connect anonymously with a caring community, and when you need more, book a licensed therapist and pay securely — all in one place." },
          ].map((s) => (
            <div key={s.n} style={{ position: "relative", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(127,119,221,0.15)", borderRadius: "16px", padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(83,74,183,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{s.icon}</div>
                <span style={{ fontSize: "34px", fontWeight: 700, color: "rgba(127,119,221,0.25)", lineHeight: 1 }}>{s.n}</span>
              </div>
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#e0deff", marginBottom: "8px" }}>{s.title}</h3>
              <p style={{ fontSize: "13px", color: "#7a7898", lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding: "80px 40px", borderTop: "1px solid rgba(127,119,221,0.1)" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ fontSize: "12px", color: "#7F77DD", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "10px" }}>FAQ</div>
          <h2 style={{ fontSize: "32px", fontWeight: 500, color: "#f0eeff", marginBottom: "10px" }}>Frequently asked questions</h2>
          <p style={{ fontSize: "15px", color: "#9d9bc4" }}>Everything you need to know before you start.</p>
        </div>

        <div style={{ maxWidth: "720px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "12px" }}>
          {[
            { q: "Is MindSpace free to use?", a: "Yes — creating an account, logging moods, viewing your trends, and joining the community are completely free. You only pay when you choose to book a session with a licensed therapist." },
            { q: "Is my data private?", a: "Absolutely. Your journal entries are yours alone, passwords are securely hashed, and you can post in the community anonymously. We never sell your personal data." },
            { q: "How does the AI insight work?", a: "When you ask for an insight, MindSpace sends a summary of your recent moods to our AI (Google Gemini), which reflects patterns back to you with gentle, practical suggestions. It's supportive guidance — not a diagnosis or a replacement for professional care." },
            { q: "Are the therapists licensed?", a: "Every therapist on MindSpace is a licensed, verified professional. You can browse by specialty, see their rates and session types, and book directly." },
            { q: "How do payments work?", a: "When you book a therapist you can pay securely via M-Pesa, card, or bank transfer. Right after paying you get a confirmation and the therapist's contact details." },
            { q: "Do I have to be a student?", a: "Not at all. MindSpace is built for anyone navigating life — students, professionals, and everyone in between." },
            { q: "Is MindSpace a replacement for therapy or emergency help?", a: "No. MindSpace supports your everyday wellbeing, but it isn't a crisis service. If you're in danger or need urgent help, please contact a local emergency line or a qualified professional." },
          ].map((f, i) => (
            <div key={i} onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(127,119,221,0.15)", borderRadius: "14px", padding: "18px 20px", cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
                <span style={{ fontSize: "15px", fontWeight: 500, color: "#e8e6ff" }}>{f.q}</span>
                <span style={{ fontSize: "20px", color: "#7F77DD", lineHeight: 1, flexShrink: 0 }}>{openFaq === i ? "−" : "+"}</span>
              </div>
              {openFaq === i && (
                <p style={{ fontSize: "14px", color: "#9d9bc4", lineHeight: 1.7, marginTop: "12px" }}>{f.a}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        textAlign: "center", padding: "80px 40px",
        borderTop: "1px solid rgba(127,119,221,0.1)",
      }}>
        <h2 style={{ fontSize: "36px", fontWeight: 500, color: "#f0eeff", marginBottom: "12px" }}>
          Your mental health journey starts today
        </h2>
        <p style={{ fontSize: "15px", color: "#9d9bc4", marginBottom: "32px" }}>
          Free to start. No credit card. Takes 2 minutes to set up.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button 
          onClick={() => navigate("/signup")}
          style={{
            padding: "14px 36px", borderRadius: "10px",
            border: "none", background: "#534AB7",
            color: "#fff", fontSize: "15px", fontWeight: 500, cursor: "pointer",
          }}>Create free account</button>
          
          <button 
          onClick={() => navigate("/signin")}
          style={{
            padding: "14px 36px", borderRadius: "10px",
            border: "1px solid rgba(127,119,221,0.3)",
            background: "transparent", color: "#c4c1f0",
            fontSize: "15px", cursor: "pointer",
          }}>Browse therapists</button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid rgba(127,119,221,0.12)", background: "#0a0a10" }}>
        <div style={{
          maxWidth: "1120px", margin: "0 auto", padding: "56px 40px 32px",
          display: "grid", gridTemplateColumns: "1.4fr 1fr 1.4fr", gap: "48px",
        }}>

          {/* Brand + contact */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <div style={{ width: "34px", height: "34px", background: "#534AB7", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>🧠</div>
              <span style={{ fontSize: "17px", fontWeight: 600, color: "#f0eeff" }}>MindSpace</span>
            </div>
            <p style={{ fontSize: "13px", color: "#8b89b8", lineHeight: 1.7, marginBottom: "20px", maxWidth: "300px" }}>
              A calm, private space to track your mood, understand your patterns, and get support — built for everyone navigating life.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <a href={`tel:${SUPPORT_PHONE}`} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#c4c1f0", textDecoration: "none" }}>
                <span style={{ width: "30px", height: "30px", borderRadius: "8px", background: "rgba(83,74,183,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>📞</span>
                {SUPPORT_PHONE}
              </a>
              <a href={`mailto:${SUPPORT_EMAIL}`} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#c4c1f0", textDecoration: "none" }}>
                <span style={{ width: "30px", height: "30px", borderRadius: "8px", background: "rgba(83,74,183,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>✉️</span>
                {SUPPORT_EMAIL}
              </a>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#c4c1f0" }}>
                <span style={{ width: "30px", height: "30px", borderRadius: "8px", background: "rgba(83,74,183,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>📍</span>
                {SUPPORT_LOCATION}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#c4c1f0" }}>
                <span style={{ width: "30px", height: "30px", borderRadius: "8px", background: "rgba(83,74,183,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>🕒</span>
                {SUPPORT_HOURS}
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 style={{ fontSize: "13px", fontWeight: 600, color: "#f0eeff", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Explore</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { label: "Create account", path: "/signup" },
                { label: "Sign in", path: "/signin" },
                { label: "Find a therapist", path: "/find-a-therapist" },
                { label: "Community forum", path: "/community-forum" },
              ].map((l) => (
                <span key={l.label} onClick={() => navigate(l.path)} style={{ fontSize: "13px", color: "#9d9bc4", cursor: "pointer" }}>{l.label}</span>
              ))}
            </div>
          </div>

          {/* Support form */}
          <div>
            <h4 style={{ fontSize: "13px", fontWeight: 600, color: "#f0eeff", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Need help?</h4>
            <p style={{ fontSize: "12px", color: "#8b89b8", marginBottom: "16px" }}>Send us your details and issue — we'll get back to you.</p>

            {sStatus === "sent" ? (
              <div style={{ background: "rgba(29,158,117,0.12)", border: "1px solid rgba(29,158,117,0.25)", borderRadius: "12px", padding: "16px", fontSize: "13px", color: "#7ee0bc" }}>
                ✓ Thanks! Your message has been sent to our team. We'll reach out soon.
              </div>
            ) : (
              <form onSubmit={handleSupportSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {sStatus === "mailto" && (
                  <p style={{ fontSize: "12px", color: "#f0b89a", margin: 0 }}>Opening your email app to finish sending…</p>
                )}
                <div style={{ display: "flex", gap: "10px" }}>
                  <input value={sName} onChange={(e) => setSName(e.target.value)} required placeholder="Your name" style={fInput} />
                  <input value={sPhone} onChange={(e) => setSPhone(e.target.value)} placeholder="Phone" style={fInput} />
                </div>
                <input value={sEmail} onChange={(e) => setSEmail(e.target.value)} required type="email" placeholder="Email address" style={fInput} />
                <textarea value={sMsg} onChange={(e) => setSMsg(e.target.value)} required rows={3} placeholder="Describe your issue…" style={{ ...fInput, resize: "none", fontFamily: "inherit" }} />
                <button type="submit" disabled={sStatus === "sending"} style={{ padding: "12px", borderRadius: "10px", border: "none", background: "#534AB7", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                  {sStatus === "sending" ? "Sending…" : "Submit request"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: "1px solid rgba(127,119,221,0.1)", padding: "20px 40px",
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px",
          maxWidth: "1120px", margin: "0 auto",
        }}>
          <div style={{ fontSize: "12px", color: "#6b6790" }}>© 2026 MindSpace. All rights reserved.</div>
          <div style={{ display: "flex", gap: "20px", fontSize: "12px", color: "#6b6790" }}>
            <span onClick={() => navigate("/privacy")} style={{ cursor: "pointer" }}>Privacy</span>
            <span onClick={() => navigate("/terms")} style={{ cursor: "pointer" }}>Terms</span>
            <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: "#6b6790", textDecoration: "none" }}>Contact</a>
          </div>
        </div>
      </footer>

    </div>
  );
}

const fInput = {
  flex: 1, width: "100%", padding: "11px 14px", borderRadius: "10px",
  border: "1px solid rgba(127,119,221,0.2)", background: "rgba(255,255,255,0.04)",
  color: "#e8e6ff", fontSize: "13px", outline: "none", boxSizing: "border-box",
};

