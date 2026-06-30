import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("there");
  const [mood, setMood] = useState(null);
  const [moodScore, setMoodScore] = useState(7);
  const [note, setNote] = useState("");

  useEffect(() => {
    // Pull user's first name from localStorage (set after login)
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
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const moods = [
    { emoji: "😢", label: "Rough", value: 2 },
    { emoji: "😟", label: "Low", value: 4 },
    { emoji: "😐", label: "Okay", value: 5 },
    { emoji: "🙂", label: "Good", value: 7 },
    { emoji: "😄", label: "Great", value: 9 },
  ];

  const sidebarItems = [
    { icon: "🏠", label: "Dashboard", path: "/dashboard", active: true },
    { icon: "📓", label: "Mood Journal", path: "/journal" },
    { icon: "📊", label: "Mood Trends", path: "/trends" },
    { icon: "💬", label: "Community Forum", path: "/forum" },
    { icon: "🩺", label: "Find a Therapist", path: "/therapists" },
    { icon: "⚙️", label: "Settings", path: "/settings" },
  ];

  const recentEntries = [
    { date: "Today, 8:14am", emoji: "😊", text: "Slept better than usual last night. Morning lecture felt manageable for once — maybe the routine is starting to stick.", tags: ["hopeful", "calm", "tired"] },
    { date: "Yesterday, 10:45pm", emoji: "😟", text: "Deadline tomorrow is stressing me out. I know I can get it done but the pressure is heavy right now.", tags: ["anxious", "focused"] },
    { date: "Mon, Jun 28", emoji: "😄", text: "Had coffee with friends on the quad. Hadn't laughed like that in weeks. Felt like myself again.", tags: ["happy", "social", "energised"] },
  ];

  const communityPosts = [
    { icon: "🌿", text: "Does anyone else find that exercise actually helps during exam season? I started 20-min walks and it's been quietly huge.", replies: 14, time: "2 hours ago" },
    { icon: "🌙", text: "Feeling isolated in a flat full of people. The paradox of uni loneliness is real. Anyone else?", replies: 27, time: "5 hours ago" },
  ];

  const chartData = [6, 6.5, 6, 6.8, 7.5, 7.8, 7.2];
  const chartDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
              onMouseEnter={e => { if (!item.active) e.currentTarget.style.background = "rgba(255,255,255,0.03)" }}
              onMouseLeave={e => { if (!item.active) e.currentTarget.style.background = "transparent" }}
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

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, padding: "28px 36px", overflowY: "auto" }}>

        {/* TOP BAR */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: 600, color: "#f0eeff", margin: 0 }}>
              {getGreeting()}, {userName} 👋
            </h1>
            <p style={{ fontSize: "14px", color: "#8b89b8", marginTop: "4px" }}>How are you feeling today?</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ position: "relative", width: "38px", height: "38px", borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(127,119,221,0.15)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              🔔
              <div style={{ position: "absolute", top: "8px", right: "8px", width: "7px", height: "7px", borderRadius: "50%", background: "#534AB7" }} />
            </div>
            <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#534AB7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", fontWeight: 600, cursor: "pointer" }}>
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* GRID ROW 1 */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginBottom: "20px" }}>

          {/* Mood Check-in Card */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(127,119,221,0.15)", borderRadius: "16px", padding: "28px" }}>
            <h2 style={{ fontSize: "17px", fontWeight: 600, margin: 0, color: "#f0eeff" }}>How's your mood today?</h2>
            <p style={{ fontSize: "13px", color: "#7a7898", marginTop: "4px", marginBottom: "24px" }}>Tap an emoji, adjust the slider, and optionally add a note.</p>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
              {moods.map(m => (
                <div key={m.label} onClick={() => { setMood(m.label); setMoodScore(m.value); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                  <div style={{
                    width: "52px", height: "52px", borderRadius: "50%",
                    background: mood === m.label ? "rgba(83,74,183,0.25)" : "rgba(255,255,255,0.04)",
                    border: mood === m.label ? "2px solid #534AB7" : "1px solid rgba(127,119,221,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px",
                  }}>{m.emoji}</div>
                  <span style={{ fontSize: "12px", color: mood === m.label ? "#a89cf5" : "#7a7898" }}>{m.label}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "13px", color: "#9d9bc4" }}>Mood score</span>
              <span style={{ fontSize: "13px", color: "#a89cf5", fontWeight: 600 }}>{moodScore} / 10</span>
            </div>
            <input
              type="range" min="1" max="10" value={moodScore}
              onChange={e => setMoodScore(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#534AB7", marginBottom: "20px" }}
            />

            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Want to add a note? (optional)"
              rows={3}
              style={{
                width: "100%", padding: "14px", borderRadius: "12px",
                border: "1px solid rgba(127,119,221,0.15)", background: "rgba(255,255,255,0.03)",
                color: "#e8e6ff", fontSize: "13px", outline: "none", resize: "none",
                boxSizing: "border-box", marginBottom: "20px", fontFamily: "inherit",
              }}
            />

            <button style={{
              width: "100%", padding: "13px", borderRadius: "12px",
              border: "none", background: "#534AB7", color: "#fff",
              fontSize: "14px", fontWeight: 600, cursor: "pointer",
            }}>Log Mood</button>
          </div>

          {/* AI Insight Card */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(127,119,221,0.15)", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#a89cf5", background: "rgba(83,74,183,0.18)", padding: "4px 10px", borderRadius: "20px", width: "fit-content", marginBottom: "16px" }}>✨ Powered by Gemini</span>
            <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0, marginBottom: "12px", color: "#f0eeff" }}>Your weekly insight</h2>
            <p style={{ fontSize: "13px", color: "#9d9bc4", lineHeight: 1.6, fontStyle: "italic", marginBottom: "16px" }}>
              "You've shown real resilience this week — dipping on Wednesday but bouncing back to your strongest score on Saturday. Your journaling consistency is up 40% and that's not small."
            </p>
            <div style={{ background: "rgba(29,158,117,0.12)", border: "1px solid rgba(29,158,117,0.25)", borderRadius: "12px", padding: "14px", fontSize: "12px", color: "#7ee0bc", marginBottom: "14px" }}>
              💡 Sleep before midnight correlates with higher next-day mood scores in your data.
            </div>
            <span style={{ fontSize: "12px", color: "#a89cf5", cursor: "pointer", marginTop: "auto" }}>Read full insight ›</span>
          </div>
        </div>

        {/* GRID ROW 2 */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginBottom: "20px" }}>

          {/* Chart Card */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(127,119,221,0.15)", borderRadius: "16px", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0, color: "#f0eeff" }}>Your mood this week</h2>
                <p style={{ fontSize: "12px", color: "#7a7898", marginTop: "2px" }}>Tracking your emotional rhythm</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "13px", color: "#a89cf5", fontWeight: 600 }}>6.9 <span style={{ color: "#7a7898", fontWeight: 400 }}>avg</span></span>
                <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "2px" }}>
                  {["Week", "Month", "Year"].map((t, i) => (
                    <span key={t} style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px", cursor: "pointer", background: i === 0 ? "#534AB7" : "transparent", color: i === 0 ? "#fff" : "#9d9bc4" }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>

            <svg viewBox="0 0 700 200" style={{ width: "100%", height: "180px" }}>
              <polyline
                points={chartData.map((v, i) => `${(i * 700) / 6},${200 - v * 20}`).join(" ")}
                fill="none" stroke="#7F77DD" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
              />
              {chartData.map((v, i) => (
                <circle key={i} cx={(i * 700) / 6} cy={200 - v * 20} r="4" fill="#534AB7" />
              ))}
            </svg>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#7a7898", marginTop: "4px" }}>
              {chartDays.map(d => <span key={d}>{d}</span>)}
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0, marginBottom: "4px", color: "#f0eeff" }}>Quick stats</h2>
            {[
              { icon: "🔥", label: "Day streak", value: "5", color: "rgba(216,90,48,0.15)" },
              { icon: "📝", label: "Entries this month", value: "23", color: "rgba(83,74,183,0.15)" },
              { icon: "💬", label: "Forum replies", value: "3", color: "rgba(29,158,117,0.15)" },
              { icon: "📈", label: "Week-on-week mood", value: "+1.4", color: "rgba(29,158,117,0.15)" },
            ].map(stat => (
              <div key={stat.label} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", borderRadius: "14px", background: stat.color }}>
                <span style={{ fontSize: "22px" }}>{stat.icon}</span>
                <div>
                  <p style={{ fontSize: "12px", color: "#c4c1f0", margin: 0 }}>{stat.label}</p>
                  <p style={{ fontSize: "18px", fontWeight: 700, color: "#fff", margin: 0 }}>{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Entries */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(127,119,221,0.15)", borderRadius: "16px", padding: "24px", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0, color: "#f0eeff" }}>Recent entries</h2>
            <span style={{ fontSize: "13px", color: "#a89cf5", cursor: "pointer" }}>View all ›</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            {recentEntries.map((entry, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(127,119,221,0.1)", borderRadius: "14px", padding: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <span style={{ fontSize: "12px", color: "#7a7898" }}>{entry.date}</span>
                  <span style={{ fontSize: "18px" }}>{entry.emoji}</span>
                </div>
                <p style={{ fontSize: "13px", color: "#c4c1f0", lineHeight: 1.5, marginBottom: "12px" }}>{entry.text}</p>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {entry.tags.map(tag => (
                    <span key={tag} style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "20px", background: "rgba(83,74,183,0.15)", color: "#a89cf5" }}>{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Community Highlights */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(127,119,221,0.15)", borderRadius: "16px", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0, color: "#f0eeff" }}>From the community</h2>
            <span style={{ fontSize: "13px", color: "#a89cf5", cursor: "pointer" }}>See forum ›</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
            {communityPosts.map((post, i) => (
              <div key={i} style={{ display: "flex", gap: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(127,119,221,0.1)", borderRadius: "14px", padding: "18px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(83,74,183,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>{post.icon}</div>
                <div>
                  <p style={{ fontSize: "13px", color: "#c4c1f0", lineHeight: 1.5, marginBottom: "10px" }}>{post.text}</p>
                  <span style={{ fontSize: "12px", color: "#7a7898" }}>💬 {post.replies} replies · {post.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
