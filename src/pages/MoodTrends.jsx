import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "mindspace_entries";
const DAY_MS = 86400000;
const EMOTION_COLORS = ["#534AB7", "#7F77DD", "#D85A30", "#9D9BC4", "#1D9E75", "#5B8FD8", "#C77DFF", "#E0A458"];

export default function MoodTrends() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("there");
  const [range, setRange] = useState("Week");
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);

  const sidebarItems = [
    { icon: "\u{1F3E0}", label: "Dashboard", path: "/dashboard" },
    { icon: "\u{1F4D3}", label: "Mood Journal", path: "/mood-journal" },
    { icon: "\u{1F4CA}", label: "Mood Trends", path: "/mood-trends", active: true },
    { icon: "\u{1F4AC}", label: "Community Forum", path: "/community-forum" },
    { icon: "\u{1FA7A}", label: "Find a Therapist", path: "/find-a-therapist" },
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
    loadEntries();

    // Keep trends in sync with the journal in real time
    const refresh = () => loadEntries();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const loadEntries = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      setEntries(Array.isArray(parsed) ? parsed : []);
    } catch (err) {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const scoreOf = (e) => e.moodScore ?? e.score ?? 5;
  const timeOf = (e) => e.timestamp ?? e.id ?? 0;

  // Build time buckets for the selected range, then average each bucket from real entries.
  const buildBuckets = () => {
    const now = new Date();
    const buckets = [];
    if (range === "Week") {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        d.setHours(0, 0, 0, 0);
        buckets.push({ label: d.toLocaleDateString([], { weekday: "short" }), start: d.getTime(), end: d.getTime() + DAY_MS });
      }
    } else if (range === "Month") {
      for (let i = 3; i >= 0; i--) {
        const end = new Date(now);
        end.setDate(now.getDate() - i * 7);
        end.setHours(23, 59, 59, 999);
        const start = new Date(end);
        start.setDate(end.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        buckets.push({ label: `Wk ${4 - i}`, start: start.getTime(), end: end.getTime() });
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        buckets.push({ label: d.toLocaleDateString([], { month: "short" }), start: d.getTime(), end: end.getTime() });
      }
    }
    return buckets.map(b => {
      const inBucket = entries.filter(e => timeOf(e) >= b.start && timeOf(e) < b.end);
      const score = inBucket.length ? inBucket.reduce((a, e) => a + scoreOf(e), 0) / inBucket.length : null;
      return { label: b.label, score: score === null ? null : Math.round(score * 10) / 10, count: inBucket.length };
    }).filter(b => b.score !== null);
  };

  const chartData = buildBuckets();
  const hasData = entries.length > 0;

  const allScores = entries.map(scoreOf);
  const avg = allScores.length ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1) : "—";

  const bucketScores = chartData.map(d => d.score);
  const max = bucketScores.length ? Math.max(...bucketScores) : 0;
  const min = bucketScores.length ? Math.min(...bucketScores) : 0;
  const best = chartData[bucketScores.indexOf(max)];
  const worst = chartData[bucketScores.indexOf(min)];

  // Emotion frequency across every tag the user has logged
  const freqMap = {};
  entries.forEach(e => (e.tags || []).forEach(t => { freqMap[t] = (freqMap[t] || 0) + 1; }));
  const emotionFrequency = Object.entries(freqMap)
    .map(([tag, count], i) => ({ tag, count, color: EMOTION_COLORS[i % EMOTION_COLORS.length] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  const maxFreq = emotionFrequency.length ? Math.max(...emotionFrequency.map(e => e.count)) : 1;

  // Average mood per weekday, from real entries
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const daySums = Array(7).fill(0);
  const dayCounts = Array(7).fill(0);
  entries.forEach(e => {
    const day = new Date(timeOf(e)).getDay();
    daySums[day] += scoreOf(e);
    dayCounts[day] += 1;
  });
  const weekdayAverages = [1, 2, 3, 4, 5, 6, 0].map(idx => ({
    day: dayNames[idx],
    avg: dayCounts[idx] ? Math.round((daySums[idx] / dayCounts[idx]) * 10) / 10 : 0,
  }));
  const maxWeekday = Math.max(1, ...weekdayAverages.map(d => d.avg));

  // Chart geometry
  const points = chartData.map((d, i) => {
    const x = (i * 660) / Math.max(chartData.length - 1, 1);
    const y = 220 - (d.score * 20);
    return { x, y, score: d.score, label: d.label };
  });
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = points.length ? `${linePath} L ${points[points.length - 1].x} 220 L ${points[0].x} 220 Z` : "";

  // Simple auto-generated insight from the real data
  const buildInsight = () => {
    if (!hasData) return "";
    const topEmotion = emotionFrequency[0];
    const rankedDays = [...weekdayAverages].filter(d => d.avg > 0).sort((a, b) => b.avg - a.avg);
    const bestDay = rankedDays[0];
    const toughDay = rankedDays[rankedDays.length - 1];
    const parts = [];
    parts.push(`Your average mood across ${entries.length} ${entries.length === 1 ? "entry" : "entries"} is ${avg}/10.`);
    if (bestDay && toughDay && bestDay.day !== toughDay.day) {
      parts.push(` You tend to feel best on ${bestDay.day}s (${bestDay.avg}/10) and lowest on ${toughDay.day}s (${toughDay.avg}/10).`);
    }
    if (topEmotion) {
      parts.push(` "${topEmotion.tag}" is the emotion you log most often.`);
    }
    parts.push(" Keep journaling — the more you log, the clearer these patterns become.");
    return parts.join("");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0d0d14", fontFamily: "system-ui, sans-serif", color: "#e8e6ff" }}>

      {/* SIDEBAR */}
      <aside style={{ width: "260px", background: "#0a0a10", borderRight: "1px solid rgba(127,119,221,0.12)", padding: "24px 16px", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", overflowY: "auto", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0 8px", marginBottom: "28px" }}>
          <div style={{ width: "34px", height: "34px", background: "#534AB7", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>{"\u{1F9E0}"}</div>
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
          <span>{"\u{1F6AA}"}</span> Logout
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, padding: "28px 36px", overflowY: "auto", height: "100vh" }}>

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

        {loading ? (
          <p style={{ color: "#7a7898", fontSize: "14px" }}>Loading your trends...</p>
        ) : !hasData ? (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "#7a7898" }}>
            <p style={{ fontSize: "36px", marginBottom: "12px" }}>📊</p>
            <p style={{ fontSize: "15px", color: "#c4c1f0", marginBottom: "6px" }}>No mood data yet</p>
            <p style={{ fontSize: "13px", marginBottom: "20px" }}>Log a few entries in your Mood Journal and your trends will appear here.</p>
            <button
              onClick={() => navigate("/mood-journal")}
              style={{ padding: "11px 22px", borderRadius: "12px", border: "none", background: "#534AB7", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
            >
              Go to Mood Journal
            </button>
          </div>
        ) : (
          <>
            {/* Summary stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "20px" }}>
              <div style={{ background: "rgba(83,74,183,0.12)", border: "1px solid rgba(127,119,221,0.2)", borderRadius: "14px", padding: "18px" }}>
                <p style={{ fontSize: "12px", color: "#c4c1f0", margin: 0 }}>Average mood</p>
                <p style={{ fontSize: "26px", fontWeight: 700, color: "#fff", margin: "4px 0 0" }}>{avg}<span style={{ fontSize: "13px", color: "#9d9bc4", fontWeight: 400 }}> / 10</span></p>
              </div>
              <div style={{ background: "rgba(29,158,117,0.12)", border: "1px solid rgba(29,158,117,0.2)", borderRadius: "14px", padding: "18px" }}>
                <p style={{ fontSize: "12px", color: "#9fe8c8", margin: 0 }}>Best {range === "Year" ? "month" : range === "Month" ? "week" : "day"}</p>
                <p style={{ fontSize: "20px", fontWeight: 700, color: "#fff", margin: "4px 0 0" }}>{best?.label || "—"} <span style={{ fontSize: "13px", color: "#7ee0bc", fontWeight: 400 }}>{max}/10</span></p>
              </div>
              <div style={{ background: "rgba(216,90,48,0.12)", border: "1px solid rgba(216,90,48,0.2)", borderRadius: "14px", padding: "18px" }}>
                <p style={{ fontSize: "12px", color: "#f0b89a", margin: 0 }}>Toughest {range === "Year" ? "month" : range === "Month" ? "week" : "day"}</p>
                <p style={{ fontSize: "20px", fontWeight: 700, color: "#fff", margin: "4px 0 0" }}>{worst?.label || "—"} <span style={{ fontSize: "13px", color: "#f0a07a", fontWeight: 400 }}>{min}/10</span></p>
              </div>
              <div style={{ background: "rgba(127,119,221,0.12)", border: "1px solid rgba(127,119,221,0.2)", borderRadius: "14px", padding: "18px" }}>
                <p style={{ fontSize: "12px", color: "#c4c1f0", margin: 0 }}>Entries logged</p>
                <p style={{ fontSize: "26px", fontWeight: 700, color: "#fff", margin: "4px 0 0" }}>{entries.length}</p>
              </div>
            </div>

            {/* Main chart */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(127,119,221,0.15)", borderRadius: "16px", padding: "28px", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0, marginBottom: "20px", color: "#f0eeff" }}>Mood over time</h2>
              {points.length === 0 ? (
                <p style={{ color: "#7a7898", fontSize: "13px" }}>No entries in this range yet. Try a wider range or log a new entry.</p>
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
                    {points.length > 1 && <path d={areaPath} fill="url(#moodGradient)" />}
                    {points.length > 1 && <path d={linePath} fill="none" stroke="#7F77DD" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
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
                {emotionFrequency.length === 0 ? (
                  <p style={{ color: "#7a7898", fontSize: "13px" }}>Tag your emotions when journaling to see them here.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {emotionFrequency.map(e => (
                      <div key={e.tag}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span style={{ fontSize: "13px", color: "#c4c1f0", textTransform: "capitalize" }}>{e.tag}</span>
                          <span style={{ fontSize: "12px", color: "#7a7898" }}>{e.count}x</span>
                        </div>
                        <div style={{ height: "8px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", overflow: "hidden" }}>
                          <div style={{ width: `${(e.count / maxFreq) * 100}%`, height: "100%", background: e.color, borderRadius: "10px" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Weekday pattern */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(127,119,221,0.15)", borderRadius: "16px", padding: "24px" }}>
                <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0, marginBottom: "20px", color: "#f0eeff" }}>Mood by day of week</h2>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: "160px", gap: "8px" }}>
                  {weekdayAverages.map(d => (
                    <div key={d.day} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", flex: 1, height: "100%", justifyContent: "flex-end" }}>
                      <span style={{ fontSize: "11px", color: "#a89cf5", fontWeight: 600 }}>{d.avg || "—"}</span>
                      <div style={{ width: "100%", height: `${(d.avg / maxWeekday) * 120}px`, minHeight: d.avg ? "4px" : "0", background: "linear-gradient(180deg, #7F77DD, #534AB7)", borderRadius: "8px 8px 0 0" }} />
                      <span style={{ fontSize: "11px", color: "#7a7898" }}>{d.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Auto-generated Pattern Insight */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(127,119,221,0.15)", borderRadius: "16px", padding: "24px", marginTop: "20px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#a89cf5", background: "rgba(83,74,183,0.18)", padding: "4px 10px", borderRadius: "20px", width: "fit-content", display: "inline-block", marginBottom: "14px" }}>{"✨"} Pattern insight</span>
              <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0, marginBottom: "10px", color: "#f0eeff" }}>What your entries show</h2>
              <p style={{ fontSize: "13px", color: "#9d9bc4", lineHeight: 1.7 }}>{buildInsight()}</p>
            </div>
          </>
        )}

      </main>
    </div>
  );
}
