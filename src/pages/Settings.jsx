import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../theme";
import Sidebar from "../components/Sidebar";
import { AccountGear } from "../components/AccountDrawer";

const PREFS_KEY = "mindspace_prefs";

export default function Settings() {
  const navigate = useNavigate();
  const { theme, setTheme, toggleTheme } = useTheme();
  const [userName, setUserName] = useState("there");
  const [nameInput, setNameInput] = useState("");
  const [savedName, setSavedName] = useState(false);
  const [prefs, setPrefs] = useState({
    dailyReminder: true,
    weeklyInsight: true,
    communityReplies: false,
    anonymousMode: true,
  });
  const [confirmClear, setConfirmClear] = useState(false);

  const sidebarItems = [
    { icon: "\u{1F3E0}", label: "Dashboard", path: "/dashboard" },
    { icon: "\u{1F4D3}", label: "Mood Journal", path: "/mood-journal" },
    { icon: "\u{1F4CA}", label: "Mood Trends", path: "/mood-trends" },
    { icon: "\u{1F4AC}", label: "Community Forum", path: "/community-forum" },
    { icon: "\u{1FA7A}", label: "Find a Therapist", path: "/find-a-therapist" },
    { icon: "⚙️", label: "Settings", path: "/settings", active: true },
  ];

  useEffect(() => {
    const storedUser = localStorage.getItem("mindspace_user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const first = user.name ? user.name.split(" ")[0] : "there";
        setUserName(first);
        setNameInput(user.name || "");
      } catch (e) {}
    }
    try {
      const storedPrefs = localStorage.getItem(PREFS_KEY);
      if (storedPrefs) setPrefs((p) => ({ ...p, ...JSON.parse(storedPrefs) }));
    } catch (e) {}
  }, []);

  const savePrefs = (next) => {
    setPrefs(next);
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  };

  const togglePref = (key) => savePrefs({ ...prefs, [key]: !prefs[key] });

  const saveName = () => {
    const name = nameInput.trim();
    if (!name) return;
    let existing = {};
    try {
      existing = JSON.parse(localStorage.getItem("mindspace_user") || "{}");
    } catch (e) {}
    localStorage.setItem("mindspace_user", JSON.stringify({ ...existing, name }));
    setUserName(name.split(" ")[0]);
    setSavedName(true);
    setTimeout(() => setSavedName(false), 2000);
  };

  const clearJournal = () => {
    localStorage.removeItem("mindspace_entries");
    setConfirmClear(false);
  };

  const card = {
    background: "var(--card)", border: "1px solid var(--border)",
    borderRadius: "16px", padding: "24px", marginBottom: "20px",
  };
  const rowStyle = {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 0", borderTop: "1px solid var(--border)",
  };
  const iconBtn = {
    width: "38px", height: "38px", borderRadius: "50%",
    background: "var(--card-2)", border: "1px solid var(--border)",
    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
    color: "var(--text-muted)",
  };

  const Toggle = ({ on, onClick }) => (
    <div
      onClick={onClick}
      style={{
        width: "44px", height: "24px", borderRadius: "20px", cursor: "pointer",
        background: on ? "#534AB7" : "var(--card-2)",
        border: on ? "1px solid #534AB7" : "1px solid var(--border)",
        display: "flex", alignItems: "center", padding: "2px",
        justifyContent: on ? "flex-end" : "flex-start", transition: "all 0.2s",
      }}
    >
      <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#fff" }} />
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)", fontFamily: "system-ui, sans-serif", color: "var(--text)" }}>

      <Sidebar />

      {/* MAIN */}
      <main style={{ flex: 1, padding: "28px 36px", overflowY: "auto", maxWidth: "760px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--text-strong)", margin: 0 }}>Settings</h1>
            <p style={{ fontSize: "13px", color: "var(--text-muted-2)", marginTop: "4px" }}>Manage your profile, preferences, and data</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div onClick={toggleTheme} title="Toggle light / dark mode" style={iconBtn}>
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </div>
            <AccountGear />
          </div>
        </div>

        {/* Profile */}
        <div style={card}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0, marginBottom: "16px", color: "var(--text-strong)" }}>Profile</h2>
          <label style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>Display name</label>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Your name"
              style={{ flex: 1, padding: "11px 14px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--card-2)", color: "var(--text)", fontSize: "13px", outline: "none" }}
            />
            <button
              onClick={saveName}
              style={{ padding: "11px 20px", borderRadius: "12px", border: "none", background: savedName ? "#1D9E75" : "#534AB7", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              {savedName ? "✓ Saved" : "Save"}
            </button>
          </div>
        </div>

        {/* Appearance */}
        <div style={card}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0, marginBottom: "6px", color: "var(--text-strong)" }}>Appearance</h2>
          <p style={{ fontSize: "12px", color: "var(--text-dim)", margin: 0 }}>Choose how MindSpace looks to you.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "16px" }}>
            {[
              { key: "light", label: "Light", bg: "#f3f2fb", sidebar: "#ffffff", bar: "rgba(83,74,183,0.28)" },
              { key: "dark", label: "Dark", bg: "#0d0d14", sidebar: "#0a0a10", bar: "rgba(127,119,221,0.4)" },
            ].map((t) => (
              <div
                key={t.key}
                onClick={() => setTheme(t.key)}
                className="hover-lift"
                style={{
                  cursor: "pointer", borderRadius: "14px", overflow: "hidden",
                  border: theme === t.key ? "2px solid #534AB7" : "1px solid var(--border)",
                  background: "var(--card-2)",
                }}
              >
                <div style={{ display: "flex", height: "84px", background: t.bg }}>
                  <div style={{ width: "26%", background: t.sidebar, borderRight: `1px solid ${t.bar}`, padding: "8px" }}>
                    <div style={{ height: "6px", width: "70%", borderRadius: "3px", background: t.bar, marginBottom: "6px" }} />
                    <div style={{ height: "6px", width: "50%", borderRadius: "3px", background: t.bar }} />
                  </div>
                  <div style={{ flex: 1, padding: "10px" }}>
                    <div style={{ height: "7px", width: "60%", borderRadius: "3px", background: t.bar, marginBottom: "8px" }} />
                    <div style={{ height: "26px", borderRadius: "6px", background: t.bar, opacity: 0.6 }} />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-soft)", fontWeight: 600 }}>
                    {t.key === "dark" ? <Moon size={14} /> : <Sun size={14} />} {t.label}
                  </span>
                  {theme === t.key && <span style={{ fontSize: "12px", color: "#a89cf5", fontWeight: 600 }}>✓ Active</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div style={card}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0, marginBottom: "6px", color: "var(--text-strong)" }}>Notifications & privacy</h2>
          <p style={{ fontSize: "12px", color: "var(--text-dim)", margin: 0 }}>Control reminders and how you appear to others.</p>
          {[
            { key: "dailyReminder", title: "Daily mood reminder", desc: "A gentle nudge to check in each day" },
            { key: "weeklyInsight", title: "Weekly insight summary", desc: "Get your mood recap every week" },
            { key: "communityReplies", title: "Community replies", desc: "Notify me when someone replies to my posts" },
            { key: "anonymousMode", title: "Anonymous in community", desc: "Hide your real name on forum posts" },
          ].map((item) => (
            <div key={item.key} style={rowStyle}>
              <div>
                <p style={{ fontSize: "14px", color: "var(--text-soft)", margin: 0 }}>{item.title}</p>
                <p style={{ fontSize: "12px", color: "var(--text-dim)", margin: 0 }}>{item.desc}</p>
              </div>
              <Toggle on={prefs[item.key]} onClick={() => togglePref(item.key)} />
            </div>
          ))}
        </div>

        {/* Data */}
        <div style={{ ...card, marginBottom: 0 }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0, marginBottom: "6px", color: "var(--text-strong)" }}>Your data</h2>
          <p style={{ fontSize: "12px", color: "var(--text-dim)", margin: 0, marginBottom: "16px" }}>Your journal entries are stored privately on this device.</p>
          {!confirmClear ? (
            <button
              onClick={() => setConfirmClear(true)}
              style={{ padding: "11px 18px", borderRadius: "12px", border: "1px solid rgba(216,90,48,0.4)", background: "rgba(216,90,48,0.12)", color: "#e07a52", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
            >
              Clear all journal entries
            </button>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "13px", color: "var(--text-soft)" }}>Are you sure? This can't be undone.</span>
              <button
                onClick={clearJournal}
                style={{ padding: "9px 16px", borderRadius: "10px", border: "none", background: "#d85a30", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
              >
                Yes, clear
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                style={{ padding: "9px 16px", borderRadius: "10px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
