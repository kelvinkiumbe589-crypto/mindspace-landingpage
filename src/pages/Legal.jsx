import { useNavigate } from "react-router-dom";

const SUPPORT_EMAIL = "kelvinkiumbe589@gmail.com";

const CONTENT = {
  privacy: {
    title: "Privacy Policy",
    intro:
      "Your privacy matters to us. This policy explains what we collect, why, and how we protect it. MindSpace is a wellness tool and does not replace professional medical care.",
    sections: [
      { h: "What we collect", p: "Account details you provide (name, email), your mood entries and journal notes, and basic usage information needed to run the service." },
      { h: "How we use it", p: "To power your dashboard, generate AI insights from your own entries, and improve the experience. We never sell your personal data." },
      { h: "AI processing", p: "Mood context you choose to analyse is sent to our AI provider (Google Gemini) solely to generate your insight or chat reply. It is not used to identify you." },
      { h: "Your control", p: "You can clear your journal entries any time from Settings, and request account deletion by contacting us." },
      { h: "Security", p: "Passwords are stored hashed, and access is protected. No method is 100% secure, but we take reasonable measures to safeguard your data." },
    ],
  },
  terms: {
    title: "Terms of Service",
    intro:
      "By using MindSpace you agree to these terms. MindSpace provides mood tracking, peer community, and therapist discovery — it is not a substitute for emergency or professional medical help.",
    sections: [
      { h: "Using the service", p: "You must provide accurate information and keep your login secure. You're responsible for activity on your account." },
      { h: "Community conduct", p: "Be kind and respectful. Harassment, hate, or harmful content is not allowed and may lead to removal." },
      { h: "Not medical advice", p: "Insights and content are for support and self-awareness only. In a crisis, contact local emergency services or a qualified professional." },
      { h: "Therapist bookings", p: "Therapist listings and bookings are provided for convenience. Sessions and payments are arranged between you and the therapist." },
      { h: "Changes", p: "We may update these terms; continued use means you accept the changes." },
    ],
  },
};

export default function Legal({ kind = "privacy" }) {
  const navigate = useNavigate();
  const data = CONTENT[kind] || CONTENT.privacy;

  return (
    <div style={{ background: "#0d0d14", minHeight: "100vh", color: "#e8e6ff", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "48px 24px 80px" }}>
        <div
          onClick={() => navigate("/")}
          style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "32px", cursor: "pointer" }}
        >
          <div style={{ width: "34px", height: "34px", background: "#534AB7", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>🧠</div>
          <span style={{ fontSize: "17px", fontWeight: 600, color: "#f0eeff" }}>MindSpace</span>
        </div>

        <h1 style={{ fontSize: "32px", fontWeight: 600, color: "#f0eeff", marginBottom: "12px" }}>{data.title}</h1>
        <p style={{ fontSize: "12px", color: "#6b6990", marginBottom: "24px" }}>Last updated: July 2026</p>
        <p style={{ fontSize: "15px", color: "#9d9bc4", lineHeight: 1.7, marginBottom: "36px" }}>{data.intro}</p>

        {data.sections.map((s) => (
          <div key={s.h} style={{ marginBottom: "28px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#e0deff", marginBottom: "8px" }}>{s.h}</h2>
            <p style={{ fontSize: "14px", color: "#9d9bc4", lineHeight: 1.7 }}>{s.p}</p>
          </div>
        ))}

        <p style={{ fontSize: "14px", color: "#9d9bc4", lineHeight: 1.7, marginTop: "36px", paddingTop: "24px", borderTop: "1px solid rgba(127,119,221,0.15)" }}>
          Questions? Contact us at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: "#7F77DD", textDecoration: "none" }}>{SUPPORT_EMAIL}</a>.
        </p>

        <button
          onClick={() => navigate("/")}
          style={{ marginTop: "32px", padding: "12px 24px", borderRadius: "10px", border: "1px solid rgba(127,119,221,0.3)", background: "transparent", color: "#c4c1f0", fontSize: "14px", cursor: "pointer" }}
        >
          ← Back to home
        </button>
      </div>
    </div>
  );
}
