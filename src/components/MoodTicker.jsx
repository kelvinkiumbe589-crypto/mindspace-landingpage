export default function MoodTicker() {
  const quotes = [
    "😊 'Finally feel like someone gets me' — 2nd year, Nairobi",
    "✨ 'The AI insight actually made me cry (happy tears)' — 3rd year, Mombasa",
    "🌱 'Two minutes a day changed my whole semester' — 1st year, Kisumu",
    "💬 'Posted at midnight, felt heard by morning' — 4th year, Eldoret",
    "🧠 'I didn't know tracking moods could feel this light' — 2nd year, Nakuru",
    "🌟 'MindSpace helped me survive finals week' — 3rd year, Nairobi",
    "🤝 'The community forum is unexpectedly wholesome' — 1st year, Thika",
    "📓 'My journal is finally a safe place' — 2nd year, Kisumu",
  ];

  const allQuotes = [...quotes, ...quotes];

  return (
    <section style={{ padding: "32px 0", overflow: "hidden", background: "rgba(83,74,183,0.08)", borderTop: "1px solid rgba(127,119,221,0.1)", borderBottom: "1px solid rgba(127,119,221,0.1)" }}>
      <p style={{ textAlign: "center", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "#7F77DD", marginBottom: "20px" }}>
        What students are saying
      </p>

      <div style={{ position: "relative" }}>
        {/* Fade left */}
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "80px", zIndex: 10, pointerEvents: "none", background: "linear-gradient(to right, #0d0d14, transparent)" }} />
        {/* Fade right */}
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "80px", zIndex: 10, pointerEvents: "none", background: "linear-gradient(to left, #0d0d14, transparent)" }} />

        <div style={{ display: "flex", animation: "ticker 40s linear infinite" }}>
          {allQuotes.map((quote, i) => (
            <div key={i} style={{
              flexShrink: 0, margin: "0 12px",
              padding: "10px 20px", borderRadius: "20px",
              fontSize: "13px", whiteSpace: "nowrap",
              color: "#c4c1f0",
              background: "rgba(83,74,183,0.15)",
              border: "1px solid rgba(127,119,221,0.2)",
            }}>
              {quote}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}