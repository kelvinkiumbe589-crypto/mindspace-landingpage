import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function MoodJournal() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("there");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterEmotion, setFilterEmotion] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [showComposer, setShowComposer] = useState(false);

  // Composer state
  const [mood, setMood] = useState(null);
  const [moodScore, setMoodScore] = useState(7);
  const [journalText, setJournalText] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [saving, setSaving] = useState(false);

  const moods = [
    { emoji: "😢", label: "Rough", value: 2 },
    { emoji: "😟", label: "Low", value: 4 },
    { emoji: "😐", label: "Okay", value: 5 },
    { emoji: "🙂", label: "Good", value: 7 },
    { emoji: "😄", label: "Great", value: 9 },
  ];

  const emotionTags = ["happy", "calm", "anxious", "tired", "hopeful", "focused", "social", "energised", "stressed", "grateful", "lonely", "motivated"];

  const sidebarItems = [
    { icon: "🏠", label: "Dashboard", path: "/dashboard" },
    { icon: "📓", label: "Mood Journal", path: "/mood-journal", active: true },
    { icon: "📊", label: "Mood Trends", path: "/mood-trends" },
    { icon: "💬", label: "Community Forum", path: "/community-forum" },
    { icon: "🩺", label: "Find a Therapist", path: "/find-a-therapist" },
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
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("mindspace_token");
      const response = await fetch("http://localhost:8080/api/moods", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setEntries(Array.isArray(data) ? data : []);
      } else {
        setEntries(sampleEntries);
      }
    } catch (err) {
      setEntries(sampleEntries);
    } finally {
      setLoading(false);
    }
  };

  const sampleEntries = [
    { id: 1, date: "Today, 8:14am", moodScore: 8, emoji: "😊", text: "Slept better than usual last night. Morning lecture felt manageable for once — maybe the routine is starting to stick.", tags: ["hopeful", "calm", "tired"] },
    { id: 2, date: "Yesterday, 10:45pm", moodScore: 4, emoji: "😟", text: "Deadline tomorrow is stressing me out. I know I can get it done but the pressure is heavy right now.", tags: ["anxious", "focused"] },
    { id: 3, date: "Mon, Jun 28", moodScore: 9, emoji: "😄", text: "Had coffee with friends on the quad. Hadn't laughed like that in weeks. Felt like myself again.", tags: ["happy", "social", "energised"] },
    { id: 4, date: "Sun, Jun 27", moodScore: 6, emoji: "🙂", text: "Quiet day. Caught up on readings and did some laundry. Nothing exciting but it felt productive.", tags: ["calm", "focused"] },
    { id: 5, date: "Sat, Jun 26", moodScore: 3, emoji: "😢", text: "Missed home a lot today. Called my mum and it helped a little, but still feeling low.", tags: ["lonely", "tired"] },
  ];

  const toggleTag = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSaveEntry = async () => {
    if (!mood) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("mindspace_token");
      const response = await fetch("http://localhost:8080/api/moods", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ moodScore, journalText, emotions: selectedTags.join(",") }),
      });
      if (response.ok) {
        await fetchEntries();
      } else {
        // optimistic local add as fallback
        const newEntry = {
          id: Date.now(), date: "Just now",
          moodScore, emoji: moods.find(m => m.label === mood)?.emoji || "🙂",
          text: journalText, tags: selectedTags,
        };
        setEntries([newEntry, ...entries]);
      }
    } catch (err) {
      const newEntry = {
        id: Date.now(), date: "Just now",
        moodScore, emoji: moods.find(m => m.label === mood)?.emoji || "🙂",
        text: journalText, tags: selectedTags,
      };
      setEntries([newEntry, ...entries]);
    } finally {
      setSaving(false);
      setShowComposer(false);
      setMood(null);
      setMoodScore(7);
      setJournalText("");
      setSelectedTags([]);
    }
  };

  const filteredEntries = entries.filter(entry => {
    const matchesEmotion = filterEmotion === "all" || (entry.tags || []).includes(filterEmotion);
    const matchesSearch = !searchText || (entry.text || "").toLowerCase().includes(searchText.toLowerCase());
    return matchesEmotion && matchesSearch;
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0d0d14", fontFamily: "system-ui, sans-serif", color: "#e8e6ff" }}>

      {/* SIDEBAR */}
      <aside style={{ width: "260px", background: "#0a0a10", borderRight: "1px solid rgba(127,119,221,0.12)", padding: "24px 16px", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", overflowY: "auto", flexShrink: 0 }}>
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

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 600, color: "#f0eeff", margin: 0 }}>Mood Journal</h1>
            <p style={{ fontSize: "13px", color: "#8b89b8", marginTop: "4px" }}>{entries.length} entries · Your private space to reflect</p>
          </div>
          <button
            onClick={() => setShowComposer(true)}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "11px 20px", borderRadius: "12px", border: "none", background: "#534AB7", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
          >
            <span>+</span> New entry
          </button>
        </div>

        {/* Search + Filter */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
          <input
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="🔍 Search your entries..."
            style={{ flex: 1, minWidth: "240px", padding: "11px 16px", borderRadius: "12px", border: "1px solid rgba(127,119,221,0.15)", background: "rgba(255,255,255,0.03)", color: "#e8e6ff", fontSize: "13px", outline: "none" }}
          />
          <select
            value={filterEmotion}
            onChange={e => setFilterEmotion(e.target.value)}
            style={{ padding: "11px 16px", borderRadius: "12px", border: "1px solid rgba(127,119,221,0.15)", background: "rgba(255,255,255,0.03)", color: "#e8e6ff", fontSize: "13px", outline: "none", cursor: "pointer" }}
          >
            <option value="all" style={{ background: "#0d0d14" }}>All emotions</option>
            {emotionTags.map(tag => (
              <option key={tag} value={tag} style={{ background: "#0d0d14" }}>{tag}</option>
            ))}
          </select>
        </div>

        {/* Composer Modal */}
        {showComposer && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
            <div style={{ width: "100%", maxWidth: "540px", background: "#13131c", border: "1px solid rgba(127,119,221,0.2)", borderRadius: "20px", padding: "28px", maxHeight: "90vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#f0eeff", margin: 0 }}>New journal entry</h2>
                <span onClick={() => setShowComposer(false)} style={{ cursor: "pointer", fontSize: "18px", color: "#7a7898" }}>✕</span>
              </div>

              <p style={{ fontSize: "13px", color: "#9d9bc4", marginBottom: "12px" }}>How are you feeling?</p>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                {moods.map(m => (
                  <div key={m.label} onClick={() => { setMood(m.label); setMoodScore(m.value); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                    <div style={{
                      width: "48px", height: "48px", borderRadius: "50%",
                      background: mood === m.label ? "rgba(83,74,183,0.25)" : "rgba(255,255,255,0.04)",
                      border: mood === m.label ? "2px solid #534AB7" : "1px solid rgba(127,119,221,0.15)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px",
                    }}>{m.emoji}</div>
                    <span style={{ fontSize: "11px", color: mood === m.label ? "#a89cf5" : "#7a7898" }}>{m.label}</span>
                  </div>
                ))}
              </div>

              <p style={{ fontSize: "13px", color: "#9d9bc4", marginBottom: "10px" }}>Tag your emotions</p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
                {emotionTags.map(tag => (
                  <span
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    style={{
                      fontSize: "12px", padding: "6px 14px", borderRadius: "20px", cursor: "pointer",
                      background: selectedTags.includes(tag) ? "#534AB7" : "rgba(255,255,255,0.04)",
                      color: selectedTags.includes(tag) ? "#fff" : "#9d9bc4",
                      border: selectedTags.includes(tag) ? "1px solid #534AB7" : "1px solid rgba(127,119,221,0.15)",
                    }}
                  >{tag}</span>
                ))}
              </div>

              <p style={{ fontSize: "13px", color: "#9d9bc4", marginBottom: "10px" }}>What's on your mind?</p>
              <textarea
                value={journalText}
                onChange={e => setJournalText(e.target.value)}
                placeholder="Write freely — this space is just for you..."
                rows={5}
                style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid rgba(127,119,221,0.15)", background: "rgba(255,255,255,0.03)", color: "#e8e6ff", fontSize: "13px", outline: "none", resize: "none", boxSizing: "border-box", marginBottom: "20px", fontFamily: "inherit" }}
              />

              <button
                onClick={handleSaveEntry}
                disabled={!mood || saving}
                style={{ width: "100%", padding: "13px", borderRadius: "12px", border: "none", background: !mood ? "rgba(83,74,183,0.3)" : "#534AB7", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: !mood ? "not-allowed" : "pointer" }}
              >
                {saving ? "Saving..." : "Save entry"}
              </button>
            </div>
          </div>
        )}

        {/* Entries List */}
        {loading ? (
          <p style={{ color: "#7a7898", fontSize: "14px" }}>Loading your entries...</p>
        ) : filteredEntries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#7a7898" }}>
            <p style={{ fontSize: "32px", marginBottom: "12px" }}>📓</p>
            <p style={{ fontSize: "14px" }}>No entries match your search. Try a different filter or write your first entry.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {filteredEntries.map(entry => (
              <div key={entry.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(127,119,221,0.15)", borderRadius: "16px", padding: "22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "22px" }}>{entry.emoji}</span>
                    <div>
                      <p style={{ fontSize: "13px", color: "#c4c1f0", margin: 0, fontWeight: 500 }}>{entry.date}</p>
                      <p style={{ fontSize: "11px", color: "#7a7898", margin: 0 }}>Mood score: {entry.moodScore}/10</p>
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: "14px", color: "#c4c1f0", lineHeight: 1.6, marginBottom: "14px" }}>{entry.text}</p>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {(entry.tags || []).map(tag => (
                    <span key={tag} style={{ fontSize: "11px", padding: "4px 12px", borderRadius: "20px", background: "rgba(83,74,183,0.15)", color: "#a89cf5" }}>{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

