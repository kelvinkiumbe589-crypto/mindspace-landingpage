import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function MoodTrends() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("there");
  const [range, setRange] = useState("Week");
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);

  const sidebarItems = [
    { icon: "🏠", label: "Dashboard", path: "/dashboard" },
    { icon: "📓", label: "Mood Journal", path: "/journal" },
    { icon: "📊", label: "Mood Trends", path: "/trends", active: true },
    { icon: "💬", label: "Community Forum", path: "/forum" },
    { icon: "🩺", label: "Find a Therapist", path: "/therapists" },
    { icon: "⚙️", label: "Settings", path: "/settings" },
  ];

  useEffect(() => {
    const storedUser = localStorage.getItem("mindspace_user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserName(user.name ? user.name.split(" ")[0] : "there");
      } catch (e) {}
    }
    fetchData();
  }, [range]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("mindspace_token");
      const response = await fetch("http://localhost:8080/api/moods", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setEntries(Array.isArray(data) && data.length > 0 ? data : sampleData[range]);
      } else {
        setEntries(sampleData[range]);
      }
    } catch (err) {
      setEntries(sampleData[range]);
    } finally {
      setLoading(false);
    }
  };

  const sampleData = {
    Week: [
      { label: "Mon", score: 6 }, { label: "Tue", score: 6.5 }, { label: "Wed", score: 4 },
      { label: "Thu", score: 6.8 }, { label: "Fri", score: 7.5 }, { label: "Sat", score: 8.2 }, { label: "Sun", score: 7.2 },
    ],
    Month: [
      { label: "Wk 1", score: 5.8 }, { label: "Wk 2", score: 6.4 }, { label: "Wk 3", score: 6.9 }, { label: "Wk 4", score: 7.3 },
    ],
    Year: [
      { label: "Jan", score: 5.5 }, { label: "Feb", score: 5.9 }, { label: "Mar", score: 6.1 }, { label: "Apr", score: 6.4 },
      { label: "May", score: 6.0 }, { label: "Jun", score: 7.2 },
    ],
  };

  const chartData = entries.length > 0 ? entries : sampleData[range];
  const scores = chartData.map(d => d.score ?? d.moodScore ?? 5);
  const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const best = chartData[scores.indexOf(max)];
  const worst = chartData[scores.indexOf(min)];

  const emotionFrequency = [
    { tag: "calm", count: 14, color: "#534AB7" },
    { tag: "hopeful", count: 11, color: "#7F77DD" },
    { tag: "anxious", count: 9, color: "#D85A30" },
    { tag: "tired", count: 8, color: "#9D9BC4" },
    { tag: "happy", count: 7, color: "#1D9E75" },
    { tag: "focused", count: 6, color: "#5B8FD8" },
  ];
  const maxFreq = Math.max(...emotionFrequency.map(e => e.count));

  const weekdayAverages = [
    { day: "Mon", avg: 6.1 }, { day: "Tue", avg: 6.4 }, { day: "Wed", avg: 5.2 },
    { day: "Thu", avg: 6.8 }, { day: "Fri", avg: 7.6 }, { day: "Sat", avg: 7.9 }, { day: "Sun", avg: 7.1 },
  ];

  const points = chartData.map((d, i) => {
    const score = d.score ?? d.moodScore ?? 5;
    const x = (i * 660) / Math.max(chartData.length - 1, 1);
    const y = 220 - (score * 20);
    return { x, y, score, label: d.label ?? d.date ?? "" };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1]?.x || 0} 220 L 0 220 Z`;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0d0d14", fontFamily: "system-ui, sans-serif", color: "#e8e6ff" }}>

      {/* SIDEBAR */}
      <aside style={{ width: "260px", background: "#0a0a10", borderRight: "1px solid rgba(127,119,221,0.12)", padding: "24px 16px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0 8px", marginBottom: "28px" }}>
          <div style={{ width: "34px", height: "34px", background: "#534AB7", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>🧠</div>
          <span style={{ fontSize: "17px", fontWeight: 600 }}>MindSpace</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", borderRadius: "12px", background: "rgba(83,74,183,0.15)", marginBottom: "20px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#534AB7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#f0eeff", margin: 0 }}>{userName}</p>
            <p style={{ fontSize: "11px", color: "#8b89b8", margin: 0 }}>Student</p>
          </div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
          {sidebarItems.map(item => (
            <div
              key={item.label}
              onClick={() => navigate(item.path)}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "10px 12px", borderRadius: "10px",
                cursor: "pointer", fontSize: "14px",
                background: item.active ? "rgba(83,74,183,0.18)" : "transparent",
                color: item.active ? "#a89cf5" : "#9d9bc4",
                fontWeight: item.active ? 600 : 400,
              }}
            >
              <span>{item.icon}</span> {item.label}
            </div>
          ))}
        </nav>

        <div
          onClick={() => { localStorage.removeItem("mindspace_user"); navigate("/"); }}
          style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", cursor: "pointer", fontSize: "14px", color: "#7a7898" }}
        >
          <span>🚪</span> Logout
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, padding: "28px 36px", overflowY: "auto" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 600, color: "#f0eeff", margin: 0 }}>Mood Trends</h1>
            <p style={{ fontSize: "13px", color: "#8b89b8", marginTop: "4px" }}>Understand your emotional patterns over time</p>
          </div>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "3px" }}>
            {["Week", "Month", "Year"].map(t => (
              <span
                key={t}
                onClick={() => setRange(t)}
                style={{ padding: "8px 16px", borderRadius: "8px", fontSize: "13px", cursor: "pointer", background: range === t ? "#534AB7" : "transparent", color: range === t ? "#fff" : "#9d9bc4", fontWeight: range === t ? 600 : 400 }}
              >{t}</span>
            ))}
          </div>
        </div>

        {/* Summary stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "20px" }}>
          <div style={{ background: "rgba(83,74,183,0.12)", border: "1px solid rgba(127,119,221,0.2)", borderRadius: "14px", padding: "18px" }}>
            <p style={{ fontSize: "12px", color: "#c4c1f0", margin: 0 }}>Average mood</p>
            <p style={{ fontSize: "26px", fontWeight: 700, color: "#fff", margin: "4px 0 0" }}>{avg}<span style={{ fontSize: "13px", color: "#9d9bc4", fontWeight: 400 }}> / 10</span></p>
          </div>
          <div style={{ background: "rgba(29,158,117,0.12)", border: "1px solid rgba(29,158,117,0.2)", borderRadius: "14px", padding: "18px" }}>
            <p style={{ fontSize: "12px", color: "#9fe8c8", margin: 0 }}>Best day</p>
            <p style={{ fontSize: "20px", fontWeight: 700, color: "#fff", margin: "4px 0 0" }}>{best?.label} <span style={{ fontSize: "13px", color: "#7ee0bc", fontWeight: 400 }}>{max}/10</span></p>
          </div>
          <div style={{ background: "rgba(216,90,48,0.12)", border: "1px solid rgba(216,90,48,0.2)", borderRadius: "14px", padding: "18px" }}>
            <p style={{ fontSize: "12px", color: "#f0b89a", margin: 0 }}>Toughest day</p>
            <p style={{ fontSize: "20px", fontWeight: 700, color: "#fff", margin: "4px 0 0" }}>{worst?.label} <span style={{ fontSize: "13px", color: "#f0a07a", fontWeight: 400 }}>{min}/10</span></p>
          </div>
          <div style={{ background: "rgba(127,119,221,0.12)", border: "1px solid rgba(127,119,221,0.2)", borderRadius: "14px", padding: "18px" }}>
            <p style={{ fontSize: "12px", color: "#c4c1f0", margin: 0 }}>Entries logged</p>
            <p style={{ fontSize: "26px", fontWeight: 700, color: "#fff", margin: "4px 0 0" }}>{chartData.length}</p>
          </div>
        </div>

        {/* Main chart */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(127,119,221,0.15)", borderRadius: "16px", padding: "28px", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0, marginBottom: "20px", color: "#f0eeff" }}>Mood over time</h2>

          {loading ? (
            <p style={{ color: "#7a7898", fontSize: "14px" }}>Loading chart...</p>
          ) : (
            <>
              <svg viewBox="0 0 660 240" style={{ width: "100%", height: "240px" }}>
                <defs>
                  <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7F77DD" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#7F77DD" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[2, 4, 6, 8, 10].map(v => (
                  <line key={v} x1="0" y1={220 - v * 20} x2="660" y2={220 - v * 20} stroke="rgba(127,119,221,0.08)" strokeWidth="1" />
                ))}
                <path d={areaPath} fill="url(#moodGradient)" />
                <path d={linePath} fill="none" stroke="#7F77DD" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                {points.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r="5" fill="#534AB7" stroke="#0d0d14" strokeWidth="2" />
                ))}
              </svg>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#7a7898", marginTop: "4px" }}>
                {points.map((p, i) => <span key={i}>{p.label}</span>)}
              </div>
            </>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

          {/* Emotion frequency */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(127,119,221,0.15)", borderRadius: "16px", padding: "24px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0, marginBottom: "20px", color: "#f0eeff" }}>Most logged emotions</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {emotionFrequency.map(e => (
                <div key={e.tag}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "13px", color: "#c4c1f0", textTransform: "capitalize" }}>{e.tag}</span>
                    <span style={{ fontSize: "12px", color: "#7a7898" }}>{e.count}×</span>
                  </div>
                  <div style={{ height: "8px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", overflow: "hidden" }}>
                    <div style={{ width: `${(e.count / maxFreq) * 100}%`, height: "100%", background: e.color, borderRadius: "10px" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekday pattern */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(127,119,221,0.15)", borderRadius: "16px", padding: "24px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0, marginBottom: "20px", color: "#f0eeff" }}>Mood by day of week</h2>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: "160px", gap: "8px" }}>
              {weekdayAverages.map(d => (
                <div key={d.day} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", flex: 1 }}>
                  <span style={{ fontSize: "11px", color: "#a89cf5", fontWeight: 600 }}>{d.avg}</span>
                  <div style={{ width: "100%", height: `${d.avg * 15}px`, background: "linear-gradient(180deg, #7F77DD, #534AB7)", borderRadius: "8px 8px 0 0" }} />
                  <span style={{ fontSize: "11px", color: "#7a7898" }}>{d.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Pattern Insight */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(127,119,221,0.15)", borderRadius: "16px", padding: "24px", marginTop: "20px" }}>
          <span style={{ fontSize: "11px", fontWeight: 600, color: "#a89cf5", background: "rgba(83,74,183,0.18)", padding: "4px 10px", borderRadius: "20px", width: "fit-content", display: "inline-block", marginBottom: "14px" }}>✨ Powered by Gemini</span>
          <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0, marginBottom: "10px", color: "#f0eeff" }}>Pattern insight</h2>
          <p style={{ fontSize: "13px", color: "#9d9bc4", lineHeight: 1.7 }}>
            Your mood consistently dips on Wednesdays — this may correlate with your mid-week workload. Weekends show your strongest scores, particularly Saturdays. Consider building small recovery rituals into your Wednesday routine, like a short walk or call with a friend, to soften the midweek dip.
          </p>
        </div>

      </main>
    </div>
  );
}
