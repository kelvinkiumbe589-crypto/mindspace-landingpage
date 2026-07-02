// MoodTicker.jsx
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

  // Double the quotes for seamless loop
  const allQuotes = [...quotes, ...quotes];

  return (
    <section className="py-12 overflow-hidden" style={{ background: "#E8F4F2" }}>
      <p className="text-center text-xs font-semibold tracking-widest uppercase mb-6" style={{ color: "#2D7A6E" }}>
        What people are saying
      </p>

      {/* Ticker wrapper */}
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to right, #E8F4F2, transparent)" }} />
        <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to left, #E8F4F2, transparent)" }} />

        {/* Scrolling track */}
        <div className="flex" style={{ animation: "ticker 35s linear infinite" }}>
          {allQuotes.map((quote, i) => (
            <div
              key={i}
              className="flex-shrink-0 mx-4 px-6 py-3 rounded-full text-sm font-medium whitespace-nowrap"
              style={{ background: "#FFFFFF", color: "#1A2B2B", boxShadow: "0 2px 8px rgba(45,122,110,0.08)" }}
            >
              {quote}
            </div>
          ))}
        </div>
      </div>

      {/* Keyframe injected via style tag */}
      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}