import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DoorOpen, Sun, Moon } from "lucide-react";
import { useTheme } from "../theme";

const ENTRIES_KEY = "mindspace_entries";
const POSTS_KEY = "mindspace_posts";

export default function Dashboard() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [userName, setUserName] = useState("there");
  const [mood, setMood] = useState(null);
  const [moodScore, setMoodScore] = useState(7);
  const [note, setNote] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [entries, setEntries] = useState([]);
  const [posts, setPosts] = useState([]);
  const [justLogged, setJustLogged] = useState(false);

  const moods = [
    { emoji: "\u{1F622}", label: "Rough", value: 2 },
    { emoji: "\u{1F61F}", label: "Low", value: 4 },
    { emoji: "\u{1F610}", label: "Okay", value: 5 },
    { emoji: "\u{1F642}", label: "Good", value: 7 },
    { emoji: "\u{1F604}", label: "Great", value: 9 },
  ];

  const emotionTags = ["happy", "calm", "anxious", "tired", "hopeful", "focused", "social", "energised", "stressed", "grateful", "lonely", "motivated"];

  const toggleTag = (tag) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const sidebarItems = [
    { icon: "\u{1F3E0}", label: "Dashboard", path: "/dashboard", active: true },
    { icon: "\u{1F4D3}", label: "Mood Journal", path: "/mood-journal" },
    { icon: "\u{1F4CA}", label: "Mood Trends", path: "/mood-trends" },
    { icon: "\u{1F4AC}", label: "Community Forum", path: "/community-forum" },
    { icon: "\u{1FA7A}", label: "Find a Therapist", path: "/find-a-therapist" },
    { icon: "⚙️", label: "Settings", path: "/settings" },
  ];

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const googleName = urlParams.get("name");
    const googleEmail = urlParams.get("email");

    if (googleName) {
      localStorage.setItem("mindspace_user", JSON.stringify({ name: googleName, email: googleEmail }));
      setUserName(googleName.split(" ")[0]);
      window.history.replaceState({}, document.title, "/dashboard");
    } else {
      const storedUser = localStorage.getItem("mindspace_user");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          const firstName = user.name ? user.name.split(" ")[0] : (user.fullName ? user.fullName.split(" ")[0] : "there");
          setUserName(firstName);
        } catch (e) {
          setUserName("there");
        }
      }
    }

    loadEntries();
    loadPosts();
  }, []);

  const loadEntries = () => {
    try {
      const stored = localStorage.getItem(ENTRIES_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      setEntries(Array.isArray(parsed) ? parsed : []);
    } catch (e) {
      setEntries([]);
    }
  };

  const loadPosts = () => {
    try {
      const stored = localStorage.getItem(POSTS_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      setPosts(Array.isArray(parsed) ? parsed : []);
    } catch (e) {
      setPosts([]);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const formatDate = (d) => {
    const time = d
      .toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      .toLowerCase()
      .replace(/\s/g, "");
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return `Today, ${time}`;
    if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
    return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  };

  const emojiForScore = (score) => {
    let closest = moods[0];
    moods.forEach((m) => {
      if (Math.abs(m.value - score) < Math.abs(closest.value - score)) closest = m;
    });
    return closest.emoji;
  };

  const canLog = mood && selectedTags.length > 0 && note.trim().length > 0;

  const handleLogMood = () => {
    if (!canLog) return;
    const now = new Date();
    const chosen = mood ? moods.find((m) => m.label === mood) : null;
    const entry = {
      id: now.getTime(),
      timestamp: now.getTime(),
      date: formatDate(now),
      moodScore,
      emoji: chosen ? chosen.emoji : emojiForScore(moodScore),
      text: note.trim(),
      tags: selectedTags,
    };
    const updated = [entry, ...entries];
    setEntries(updated);
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(updated));
    setMood(null);
    setMoodScore(7);
    setNote("");
    setSelectedTags([]);
    setJustLogged(true);
    setTimeout(() => setJustLogged(false), 2500);
  };

  // ── Real stats derived from saved entries ──
  const scoreOf = (e) => e.moodScore ?? 5;
  const timeOf = (e) => e.timestamp ?? e.id ?? 0;

  const dayStreak = (() => {
    const days = new Set(entries.map((e) => new Date(timeOf(e)).toDateString()));
    let streak = 0;
    const d = new Date();
    if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
    while (days.has(d.toDateString())) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  })();

  const now = new Date();
  const entriesThisMonth = entries.filter((e) => {
    const d = new Date(timeOf(e));
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const avgMood = entries.length
    ? (entries.reduce((a, e) => a + scoreOf(e), 0) / entries.length).toFixed(1)
    : "—";

  // Week buckets (last 7 days) for the chart + week-on-week comparison
  const DAY_MS = 86400000;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const weekBuckets = [];
  for (let i = 6; i >= 0; i--) {
    const start = startOfToday.getTime() - i * DAY_MS;
    const end = start + DAY_MS;
    const inDay = entries.filter((e) => timeOf(e) >= start && timeOf(e) < end);
    const score = inDay.length ? inDay.reduce((a, e) => a + scoreOf(e), 0) / inDay.length : null;
    weekBuckets.push({
      label: new Date(start).toLocaleDateString([], { weekday: "short" }),
      score,
    });
  }
  const weekScores = weekBuckets.filter((b) => b.score !== null).map((b) => b.score);
  const weekAvg = weekScores.length ? (weekScores.reduce((a, b) => a + b, 0) / weekScores.length).toFixed(1) : "—";

  const thisWeekEntries = entries.filter((e) => timeOf(e) >= startOfToday.getTime() - 6 * DAY_MS);
  const lastWeekEntries = entries.filter(
    (e) => timeOf(e) >= startOfToday.getTime() - 13 * DAY_MS && timeOf(e) < startOfToday.getTime() - 6 * DAY_MS
  );
  const meanScore = (arr) => (arr.length ? arr.reduce((a, e) => a + scoreOf(e), 0) / arr.length : null);
  const thisWeekMean = meanScore(thisWeekEntries);
  const lastWeekMean = meanScore(lastWeekEntries);
  const weekOnWeek =
    thisWeekMean !== null && lastWeekMean !== null
      ? (thisWeekMean - lastWeekMean >= 0 ? "+" : "") + (thisWeekMean - lastWeekMean).toFixed(1)
      : "—";

  const quickStats = [
    { icon: "\u{1F525}", label: "Day streak", value: String(dayStreak), color: "rgba(216,90,48,0.15)" },
    { icon: "\u{1F4DD}", label: "Entries this month", value: String(entriesThisMonth), color: "rgba(83,74,183,0.15)" },
    { icon: "\u{1F4CA}", label: "Average mood", value: avgMood === "—" ? "—" : `${avgMood}`, color: "rgba(29,158,117,0.15)" },
    { icon: "\u{1F4C8}", label: "Week-on-week mood", value: weekOnWeek, color: "rgba(29,158,117,0.15)" },
  ];

  const recentEntries = entries.slice(0, 3);

  // Chart geometry for week buckets that have data
  const chartPoints = weekBuckets.map((b, i) => ({
    x: (i * 700) / 6,
    y: b.score === null ? null : 200 - b.score * 20,
    label: b.label,
  }));
  const drawnPoints = chartPoints.filter((p) => p.y !== null);
  const polyline = drawnPoints.map((p) => `${p.x},${p.y}`).join(" ");

  // Community preview from real forum posts
  const communityPreview = posts.slice(0, 2).map((p) => ({
    initial: (p.author || "?").charAt(0).toUpperCase(),
    text: p.body || p.title || "",
    replies: (p.comments || []).length,
    time: p.time || "",
  }));

  const iconBtn = {
    width: "38px", height: "38px", borderRadius: "50%",
    background: "var(--card-2)", border: "1px solid var(--border)",
    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
    color: "var(--text-muted)",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)", fontFamily: "system-ui, sans-serif", color: "var(--text)" }}>

      <aside style={{ width: "260px", background: "var(--sidebar)", borderRight: "1px solid var(--border)", padding: "24px 16px", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", overflowY: "auto", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0 8px", marginBottom: "28px" }}>
          <div style={{ width: "34px", height: "34px", background: "#534AB7", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>{"\u{1F9E0}"}</div>
          <span style={{ fontSize: "17px", fontWeight: 600 }}>MindSpace</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", borderRadius: "12px", background: "rgba(83,74,183,0.15)", marginBottom: "20px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#534AB7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", color: "#fff" }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-strong)", margin: 0 }}>{userName}</p>
            <p style={{ fontSize: "11px", color: "var(--text-muted-2)", margin: 0 }}>Student</p>
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
                color: item.active ? "var(--accent-soft)" : "var(--text-muted)",
                fontWeight: item.active ? 600 : 400,
              }}
            >
              <span>{item.icon}</span> {item.label}
            </div>
          ))}
        </nav>

        <div
          onClick={() => { localStorage.removeItem("mindspace_user"); navigate("/"); }}
          style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", cursor: "pointer", fontSize: "14px", color: "var(--text-dim)" }}
        >
          <DoorOpen size={16} /> Logout
        </div>
      </aside>

      <main style={{ flex: 1, padding: "28px 36px", overflowY: "auto" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: 600, color: "var(--text-strong)", margin: 0 }}>
              {getGreeting()}, {userName} {"\u{1F44B}"}
            </h1>
            <p style={{ fontSize: "14px", color: "var(--text-muted-2)", marginTop: "4px" }}>How are you feeling today?</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div onClick={toggleTheme} title="Toggle light / dark mode" style={iconBtn}>
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </div>
            <div style={{ ...iconBtn, position: "relative", fontSize: "16px" }}>
              {"\u{1F514}"}
              <div style={{ position: "absolute", top: "8px", right: "8px", width: "7px", height: "7px", borderRadius: "50%", background: "#534AB7" }} />
            </div>
            <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#534AB7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", fontWeight: 600, cursor: "pointer", color: "#fff" }}>
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginBottom: "20px" }}>

          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "28px" }}>
            <h2 style={{ fontSize: "17px", fontWeight: 600, margin: 0, color: "var(--text-strong)" }}>How's your mood today?</h2>
            <p style={{ fontSize: "13px", color: "var(--text-dim)", marginTop: "4px", marginBottom: "24px" }}>Tap an emoji, adjust the slider, and optionally add a note.</p>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
              {moods.map(m => (
                <div key={m.label} onClick={() => { setMood(m.label); setMoodScore(m.value); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                  <div style={{
                    width: "52px", height: "52px", borderRadius: "50%",
                    background: mood === m.label ? "rgba(83,74,183,0.25)" : "var(--card-2)",
                    border: mood === m.label ? "2px solid #534AB7" : "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px",
                  }}>{m.emoji}</div>
                  <span style={{ fontSize: "12px", color: mood === m.label ? "var(--accent-soft)" : "var(--text-dim)" }}>{m.label}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Mood score</span>
              <span style={{ fontSize: "13px", color: "var(--accent-soft)", fontWeight: 600 }}>{moodScore} / 10</span>
            </div>
            <input
              type="range" min="1" max="10" value={moodScore}
              onChange={e => setMoodScore(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#534AB7", marginBottom: "20px" }}
            />

            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "10px" }}>Tag your emotions <span style={{ color: "#e07a52" }}>*</span></p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
              {emotionTags.map(tag => (
                <span
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  style={{
                    fontSize: "12px", padding: "6px 14px", borderRadius: "20px", cursor: "pointer",
                    background: selectedTags.includes(tag) ? "#534AB7" : "var(--card-2)",
                    color: selectedTags.includes(tag) ? "#fff" : "var(--text-muted)",
                    border: selectedTags.includes(tag) ? "1px solid #534AB7" : "1px solid var(--border)",
                  }}
                >{tag}</span>
              ))}
            </div>

            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "10px" }}>What's on your mind? <span style={{ color: "#e07a52" }}>*</span></p>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Write what's on your mind..."
              rows={3}
              style={{
                width: "100%", padding: "14px", borderRadius: "12px",
                border: "1px solid var(--border)", background: "var(--card)",
                color: "var(--text)", fontSize: "13px", outline: "none", resize: "none",
                boxSizing: "border-box", marginBottom: "12px", fontFamily: "inherit",
              }}
            />

            {!canLog && (
              <p style={{ fontSize: "12px", color: "var(--text-dim)", marginBottom: "12px" }}>
                Pick a mood, tag at least one emotion, and write a note to log.
              </p>
            )}

            <button
              onClick={handleLogMood}
              disabled={!canLog}
              style={{
                width: "100%", padding: "13px", borderRadius: "12px",
                border: "none", background: justLogged ? "#1D9E75" : (!canLog ? "rgba(83,74,183,0.3)" : "#534AB7"), color: "#fff",
                fontSize: "14px", fontWeight: 600, cursor: !canLog ? "not-allowed" : "pointer", transition: "background 0.2s",
              }}
            >
              {justLogged ? "✓ Saved to your journal" : "Log Mood"}
            </button>
          </div>

          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--accent-soft)", background: "rgba(83,74,183,0.18)", padding: "4px 10px", borderRadius: "20px", width: "fit-content", marginBottom: "16px" }}>{"✨"} Your insight</span>
            <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0, marginBottom: "12px", color: "var(--text-strong)" }}>Weekly insight</h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "16px" }}>
              {entries.length === 0
                ? "Log your first mood to start building insights. Every entry helps you see your patterns more clearly."
                : `You've logged ${entries.length} ${entries.length === 1 ? "entry" : "entries"} so far, with an average mood of ${avgMood}/10${dayStreak > 1 ? ` and a ${dayStreak}-day streak going` : ""}. Keep showing up for yourself.`}
            </p>
            <div style={{ background: "rgba(29,158,117,0.12)", border: "1px solid rgba(29,158,117,0.25)", borderRadius: "12px", padding: "14px", fontSize: "12px", color: "#3fae86", marginBottom: "14px" }}>
              {"\u{1F4A1}"} Logging at a consistent time each day makes your trends more meaningful.
            </div>
            <span onClick={() => navigate("/mood-trends")} style={{ fontSize: "12px", color: "var(--accent-soft)", cursor: "pointer", marginTop: "auto" }}>View your trends {"›"}</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginBottom: "20px" }}>

          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0, color: "var(--text-strong)" }}>Your mood this week</h2>
                <p style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "2px" }}>Tracking your emotional rhythm</p>
              </div>
              <span style={{ fontSize: "13px", color: "var(--accent-soft)", fontWeight: 600 }}>{weekAvg} <span style={{ color: "var(--text-dim)", fontWeight: 400 }}>avg</span></span>
            </div>

            {drawnPoints.length === 0 ? (
              <p style={{ color: "var(--text-dim)", fontSize: "13px", padding: "40px 0", textAlign: "center" }}>No entries this week yet. Log a mood to see your rhythm.</p>
            ) : (
              <>
                <svg viewBox="0 0 700 200" style={{ width: "100%", height: "180px" }}>
                  {drawnPoints.length > 1 && (
                    <polyline
                      points={polyline}
                      fill="none" stroke="#7F77DD" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                    />
                  )}
                  {drawnPoints.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="4" fill="#534AB7" />
                  ))}
                </svg>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-dim)", marginTop: "4px" }}>
                  {chartPoints.map((p, i) => <span key={i}>{p.label}</span>)}
                </div>
              </>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0, marginBottom: "4px", color: "var(--text-strong)" }}>Quick stats</h2>
            {quickStats.map(stat => (
              <div key={stat.label} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", borderRadius: "14px", background: stat.color }}>
                <span style={{ fontSize: "22px" }}>{stat.icon}</span>
                <div>
                  <p style={{ fontSize: "12px", color: "var(--text-soft)", margin: 0 }}>{stat.label}</p>
                  <p style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-strong)", margin: 0 }}>{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0, color: "var(--text-strong)" }}>Recent entries</h2>
            <span onClick={() => navigate("/mood-journal")} style={{ fontSize: "13px", color: "var(--accent-soft)", cursor: "pointer" }}>View all {"›"}</span>
          </div>
          {recentEntries.length === 0 ? (
            <p style={{ color: "var(--text-dim)", fontSize: "13px", padding: "20px 0", textAlign: "center" }}>No entries yet. Log your mood above to get started.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
              {recentEntries.map((entry, i) => (
                <div key={entry.id ?? i} style={{ background: "var(--card-3)", border: "1px solid var(--border)", borderRadius: "14px", padding: "18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>{entry.date}</span>
                    <span style={{ fontSize: "18px" }}>{entry.emoji}</span>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--text-soft)", lineHeight: 1.5, marginBottom: "12px" }}>
                    {entry.text || <span style={{ color: "var(--text-dim)", fontStyle: "italic" }}>No note · mood {entry.moodScore}/10</span>}
                  </p>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {(entry.tags || []).map(tag => (
                      <span key={tag} style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "20px", background: "rgba(83,74,183,0.15)", color: "var(--accent-soft)" }}>{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0, color: "var(--text-strong)" }}>From the community</h2>
            <span onClick={() => navigate("/community-forum")} style={{ fontSize: "13px", color: "var(--accent-soft)", cursor: "pointer" }}>See forum {"›"}</span>
          </div>
          {communityPreview.length === 0 ? (
            <p style={{ color: "var(--text-dim)", fontSize: "13px", padding: "20px 0", textAlign: "center" }}>Visit the Community Forum to see and share posts.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
              {communityPreview.map((post, i) => (
                <div key={i} style={{ display: "flex", gap: "12px", background: "var(--card-3)", border: "1px solid var(--border)", borderRadius: "14px", padding: "18px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(83,74,183,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 600, flexShrink: 0, color: "var(--accent-soft)" }}>{post.initial}</div>
                  <div>
                    <p style={{ fontSize: "13px", color: "var(--text-soft)", lineHeight: 1.5, marginBottom: "10px" }}>{post.text}</p>
                    <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>{"\u{1F4AC}"} {post.replies} {post.replies === 1 ? "reply" : "replies"} {"·"} {post.time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
