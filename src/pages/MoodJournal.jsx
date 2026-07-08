import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../theme";
import { useReveal } from "../useReveal";
import Sidebar from "../components/Sidebar";
import MicButton from "../components/MicButton";
import { AccountGear } from "../components/AccountDrawer";
import { loadMoods, saveMood, deleteMood } from "../moods";

const STORAGE_KEY = "mindspace_entries";

// Map a mood score to an accent colour for the entry's timeline border
const moodColor = (s) =>
  s >= 8 ? "#1D9E75" : s >= 6 ? "#7F77DD" : s >= 5 ? "#5B8FD8" : s >= 4 ? "#E0A458" : "#D85A30";

export default function MoodJournal() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  useReveal([]);
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
    loadEntries();

    // If the user shared text into MindSpace (from another app), open the
    // composer with it prefilled.
    try {
      const shared = sessionStorage.getItem("mindspace_shared_text");
      if (shared) {
        setJournalText(shared);
        setShowComposer(true);
        sessionStorage.removeItem("mindspace_shared_text");
      }
    } catch (e) {}

    // Keep the list fresh with moods logged elsewhere (e.g. the Dashboard)
    const refresh = () => loadEntries();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const loadEntries = async () => {
    setLoading(true);
    const list = await loadMoods();
    setEntries(list);
    setLoading(false);
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const resetComposer = () => {
    setShowComposer(false);
    setMood(null);
    setMoodScore(7);
    setJournalText("");
    setSelectedTags([]);
  };

  const canSave = mood && selectedTags.length > 0 && journalText.trim().length > 0;

  const handleSaveEntry = async () => {
    if (!canSave) return;
    setSaving(true);
    const updated = await saveMood({
      moodScore,
      tags: selectedTags,
      text: journalText.trim(),
      emoji: moods.find(m => m.label === mood)?.emoji,
    });
    setEntries(updated);
    setSaving(false);
    resetComposer();
  };

  const handleDelete = async (id) => {
    const updated = await deleteMood(id);
    setEntries(updated);
  };

  const filteredEntries = entries.filter(entry => {
    const matchesEmotion = filterEmotion === "all" || (entry.tags || []).includes(filterEmotion);
    const matchesSearch = !searchText || (entry.text || "").toLowerCase().includes(searchText.toLowerCase());
    return matchesEmotion && matchesSearch;
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)", fontFamily: "system-ui, sans-serif", color: "var(--text)" }}>

      <Sidebar />

      {/* MAIN */}
      <main style={{ flex: 1, padding: "28px 36px", overflowY: "auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--text-strong)", margin: 0 }}>Mood Journal</h1>
            <p style={{ fontSize: "13px", color: "var(--text-muted-2)", marginTop: "4px" }}>{entries.length} {entries.length === 1 ? "entry" : "entries"} · Your private space to reflect</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              onClick={toggleTheme}
              title="Toggle light / dark mode"
              style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--card-2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-muted)" }}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </div>
            <AccountGear size={40} />
            <button
              onClick={() => setShowComposer(true)}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "11px 20px", borderRadius: "12px", border: "none", background: "#534AB7", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
            >
              <span>+</span> New entry
            </button>
          </div>
        </div>

        {/* Search + Filter */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
          <input
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="🔍 Search your entries..."
            style={{ flex: 1, minWidth: "240px", padding: "11px 16px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)", fontSize: "13px", outline: "none" }}
          />
          <select
            value={filterEmotion}
            onChange={e => setFilterEmotion(e.target.value)}
            style={{ padding: "11px 16px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)", fontSize: "13px", outline: "none", cursor: "pointer" }}
          >
            <option value="all" style={{ background: "var(--bg)" }}>All emotions</option>
            {emotionTags.map(tag => (
              <option key={tag} value={tag} style={{ background: "var(--bg)" }}>{tag}</option>
            ))}
          </select>
        </div>

        {/* Composer Modal */}
        {showComposer && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
            <div style={{ width: "100%", maxWidth: "540px", background: "var(--elevated)", border: "1px solid var(--border)", borderRadius: "20px", padding: "28px", maxHeight: "90vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-strong)", margin: 0 }}>New journal entry</h2>
                <span onClick={resetComposer} style={{ cursor: "pointer", fontSize: "18px", color: "var(--text-dim)" }}>✕</span>
              </div>

              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "12px" }}>How are you feeling?</p>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                {moods.map(m => (
                  <div key={m.label} onClick={() => { setMood(m.label); setMoodScore(m.value); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                    <div style={{
                      width: "48px", height: "48px", borderRadius: "50%",
                      background: mood === m.label ? "rgba(83,74,183,0.25)" : "var(--card-2)",
                      border: mood === m.label ? "2px solid #534AB7" : "1px solid var(--border)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px",
                    }}>{m.emoji}</div>
                    <span style={{ fontSize: "11px", color: mood === m.label ? "var(--accent-soft)" : "var(--text-dim)" }}>{m.label}</span>
                  </div>
                ))}
              </div>

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

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", gap: "10px" }}>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>What's on your mind? <span style={{ color: "#e07a52" }}>*</span></p>
                <MicButton onText={(t) => setJournalText((prev) => (prev ? prev.trim() + " " : "") + t)} />
              </div>
              <textarea
                value={journalText}
                onChange={e => setJournalText(e.target.value)}
                placeholder="Write freely — this space is just for you..."
                rows={5}
                style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)", fontSize: "13px", outline: "none", resize: "none", boxSizing: "border-box", marginBottom: "12px", fontFamily: "inherit" }}
              />

              {!canSave && (
                <p style={{ fontSize: "12px", color: "var(--text-dim)", marginBottom: "12px" }}>
                  Pick a mood, tag at least one emotion, and write a note to save.
                </p>
              )}

              <button
                onClick={handleSaveEntry}
                disabled={!canSave || saving}
                style={{ width: "100%", padding: "13px", borderRadius: "12px", border: "none", background: !canSave ? "rgba(83,74,183,0.3)" : "#534AB7", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: !canSave ? "not-allowed" : "pointer" }}
              >
                {saving ? "Saving..." : "Save entry"}
              </button>
            </div>
          </div>
        )}

        {/* Entries List */}
        {loading ? (
          <p style={{ color: "var(--text-dim)", fontSize: "14px" }}>Loading your entries...</p>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "70px 20px", color: "var(--text-dim)" }}>
            <p style={{ fontSize: "36px", marginBottom: "12px" }}>📓</p>
            <p style={{ fontSize: "15px", color: "var(--text-soft)", marginBottom: "6px" }}>Your journal is empty</p>
            <p style={{ fontSize: "13px", marginBottom: "20px" }}>Write your first entry to start tracking how you feel.</p>
            <button
              onClick={() => setShowComposer(true)}
              style={{ padding: "11px 22px", borderRadius: "12px", border: "none", background: "#534AB7", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
            >
              + Write your first entry
            </button>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-dim)" }}>
            <p style={{ fontSize: "32px", marginBottom: "12px" }}>🔍</p>
            <p style={{ fontSize: "14px" }}>No entries match your search. Try a different filter or search term.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {filteredEntries.map(entry => (
              <div key={entry.id} className="hover-lift" style={{ background: "var(--card)", border: "1px solid var(--border)", borderLeft: `4px solid ${moodColor(entry.moodScore)}`, borderRadius: "16px", padding: "22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "22px" }}>{entry.emoji}</span>
                    <div>
                      <p style={{ fontSize: "13px", color: "var(--text-soft)", margin: 0, fontWeight: 500 }}>{entry.date}</p>
                      <p style={{ fontSize: "11px", color: "var(--text-dim)", margin: 0 }}>Mood score: {entry.moodScore}/10</p>
                    </div>
                  </div>
                  <span
                    onClick={() => handleDelete(entry.id)}
                    title="Delete entry"
                    style={{ cursor: "pointer", fontSize: "14px", color: "var(--text-dim)", padding: "4px" }}
                  >🗑️</span>
                </div>
                {entry.text && <p style={{ fontSize: "14px", color: "var(--text-soft)", lineHeight: 1.6, marginBottom: "14px" }}>{entry.text}</p>}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {(entry.tags || []).map(tag => (
                    <span key={tag} style={{ fontSize: "11px", padding: "4px 12px", borderRadius: "20px", background: "rgba(83,74,183,0.15)", color: "var(--accent-soft)" }}>{tag}</span>
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
