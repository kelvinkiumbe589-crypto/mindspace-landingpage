import MoodTicker from "../components/MoodTicker";





export default function LandingPage() {
  return (
    <div style={{ background: "#0d0d14", minHeight: "100vh", color: "#e8e6ff", fontFamily: "system-ui, sans-serif" }}>

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
          {["Features", "How it works", "Community", "Therapists"].map(item => (
            <span key={item} style={{ cursor: "pointer" }}
              onMouseEnter={e => e.target.style.color = "#e8e6ff"}
              onMouseLeave={e => e.target.style.color = "#9d9bc4"}>
              {item}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={{
            padding: "8px 20px", borderRadius: "8px",
            border: "1px solid rgba(127,119,221,0.3)",
            background: "transparent", color: "#c4c1f0",
            fontSize: "14px", cursor: "pointer",
          }}>Log in</button>
          <button style={{
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
          <button style={{
            padding: "13px 32px", borderRadius: "10px",
            border: "none", background: "#534AB7",
            color: "#fff", fontSize: "15px",
            fontWeight: 500, cursor: "pointer",
          }}>Start for free</button>
          <button style={{
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
      <section style={{ padding: "80px 40px" }}>
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
          <button style={{
            padding: "14px 36px", borderRadius: "10px",
            border: "none", background: "#534AB7",
            color: "#fff", fontSize: "15px", fontWeight: 500, cursor: "pointer",
          }}>Create free account</button>
          <button style={{
            padding: "14px 36px", borderRadius: "10px",
            border: "1px solid rgba(127,119,221,0.3)",
            background: "transparent", color: "#c4c1f0",
            fontSize: "15px", cursor: "pointer",
          }}>Browse therapists</button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        padding: "24px 40px",
        borderTop: "1px solid rgba(127,119,221,0.1)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#4a4870" }}>
          <span>🧠</span> MindSpace
        </div>
        <div style={{ fontSize: "12px", color: "#4a4870" }}>Built with Java Spring Boot + React</div>
        <div style={{ display: "flex", gap: "20px", fontSize: "12px", color: "#4a4870" }}>
          {["Privacy", "Terms", "Contact"].map(l => <span key={l} style={{ cursor: "pointer" }}>{l}</span>)}
        </div>
      </footer>

    </div>
  );
}

