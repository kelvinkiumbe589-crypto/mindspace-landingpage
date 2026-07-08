import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings as Gear, X, Sun, Moon, LogOut, ChevronRight,
  BookOpen, BarChart3, MessageCircle, HelpCircle, Flame, PenLine,
  Camera, Trash2,
} from "lucide-react";
import { useTheme } from "../theme";
import { logout } from "../auth";
import Avatar from "./Avatar";
import { getProfile, saveAvatar, removeAvatar, fileToAvatarDataUrl } from "../lib/avatar";

const SUPPORT_EMAIL = "kelvinkiumbe589@gmail.com";

export default function AccountDrawer() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [, bump] = useState(0); // re-read profile when the photo/name changes
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoErr, setPhotoErr] = useState("");
  const fileRef = useRef(null);

  // Opened by the gear buttons in each page header (see AccountGear)
  useEffect(() => {
    const h = () => setOpen(true);
    const refresh = () => bump((n) => n + 1);
    window.addEventListener("mindspace:open-account", h);
    window.addEventListener("mindspace:profile-updated", refresh);
    return () => {
      window.removeEventListener("mindspace:open-account", h);
      window.removeEventListener("mindspace:profile-updated", refresh);
    };
  }, []);

  let name = "there";
  let email = "";
  let avatarUrl = "";
  try {
    const u = JSON.parse(localStorage.getItem("mindspace_user") || "{}");
    if (u.name) name = u.name;
    if (u.email) email = u.email;
    if (u.avatarUrl) avatarUrl = u.avatarUrl;
  } catch (e) {}

  // Quick stats from saved entries
  let entries = [];
  try {
    entries = JSON.parse(localStorage.getItem("mindspace_entries") || "[]");
  } catch (e) {}
  const total = Array.isArray(entries) ? entries.length : 0;
  const streak = (() => {
    if (!total) return 0;
    const days = new Set(entries.map((e) => new Date(e.timestamp ?? e.id ?? 0).toDateString()));
    let s = 0;
    const d = new Date();
    if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
    while (days.has(d.toDateString())) { s++; d.setDate(d.getDate() - 1); }
    return s;
  })();

  const go = (path) => { setOpen(false); navigate(path); };

  const pickPhoto = () => fileRef.current?.click();
  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    setPhotoBusy(true); setPhotoErr("");
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      // Keep whatever visibility the user already chose (defaults to private).
      await saveAvatar(dataUrl, getProfile().avatarVisibility || "private");
    } catch (err) {
      setPhotoErr(err.message || "Couldn't set that photo.");
    } finally { setPhotoBusy(false); }
  };
  const onRemovePhoto = async () => {
    setPhotoBusy(true); setPhotoErr("");
    try { await removeAvatar(); } finally { setPhotoBusy(false); }
  };

  const menu = [
    { label: "All settings", icon: Gear, action: () => go("/settings") },
    { label: "Mood journal", icon: BookOpen, action: () => go("/mood-journal") },
    { label: "Mood trends", icon: BarChart3, action: () => go("/mood-trends") },
    { label: "Community forum", icon: MessageCircle, action: () => go("/community-forum") },
    { label: "Help & support", icon: HelpCircle, action: () => { window.location.href = `mailto:${SUPPORT_EMAIL}`; } },
  ];

  const row = {
    display: "flex", alignItems: "center", gap: "12px", width: "100%",
    padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--border)",
    background: "var(--card-2)", color: "var(--text-soft)", fontSize: "14px",
    cursor: "pointer", textAlign: "left",
  };
  const statCard = {
    flex: 1, background: "var(--card-2)", border: "1px solid var(--border)",
    borderRadius: "12px", padding: "12px", display: "flex", alignItems: "center", gap: "10px",
  };

  return (
    <>
      {/* Blurred backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 300,
            background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)",
          }}
        />
      )}

      {/* Slide-in drawer */}
      <div
        style={{
          position: "fixed", top: 0, right: 0, height: "100vh", width: "min(340px, 90vw)",
          zIndex: 310, background: "var(--elevated)", borderLeft: "1px solid var(--border)",
          boxShadow: "-20px 0 50px rgba(0,0,0,0.3)", padding: "20px",
          display: "flex", flexDirection: "column", gap: "18px",
          transform: open ? "translateX(0)" : "translateX(105%)",
          transition: "transform 0.28s ease", overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-strong)" }}>Account</span>
          <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)" }}>
            <X size={20} />
          </button>
        </div>

        {/* Profile */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px", borderRadius: "14px", background: "rgba(83,74,183,0.12)", border: "1px solid var(--border)" }}>
          {/* Tap the avatar to change your photo */}
          <button
            onClick={pickPhoto}
            disabled={photoBusy}
            title="Change photo"
            style={{ position: "relative", background: "none", border: "none", padding: 0, cursor: photoBusy ? "wait" : "pointer", flexShrink: 0, opacity: photoBusy ? 0.6 : 1 }}
          >
            <Avatar name={name} src={avatarUrl} size={48} ring="var(--elevated)" />
            <span style={{ position: "absolute", right: -3, bottom: -3, width: "20px", height: "20px", borderRadius: "50%", border: "2px solid var(--elevated)", background: "#534AB7", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Camera size={11} />
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} style={{ display: "none" }} />

          <div style={{ overflow: "hidden" }}>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-strong)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{email || "No email on file"}</p>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
              <button onClick={pickPhoto} disabled={photoBusy} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "11px", fontWeight: 600, color: "var(--accent-soft)" }}>
                {photoBusy ? "Saving…" : avatarUrl ? "Change photo" : "Add photo"}
              </button>
              {avatarUrl && !photoBusy && (
                <button onClick={onRemovePhoto} style={{ display: "flex", alignItems: "center", gap: "3px", background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "11px", color: "var(--text-dim)" }}>
                  <Trash2 size={11} /> Remove
                </button>
              )}
            </div>
          </div>
        </div>
        {photoErr && <p style={{ fontSize: "12px", color: "#f0a07a", margin: "-8px 0 0" }}>{photoErr}</p>}

        {/* Quick stats */}
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={statCard}>
            <Flame size={18} style={{ color: "#e07a52" }} />
            <div>
              <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-strong)", margin: 0 }}>{streak}</p>
              <p style={{ fontSize: "11px", color: "var(--text-dim)", margin: 0 }}>day streak</p>
            </div>
          </div>
          <div style={statCard}>
            <PenLine size={18} style={{ color: "var(--accent-soft)" }} />
            <div>
              <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-strong)", margin: 0 }}>{total}</p>
              <p style={{ fontSize: "11px", color: "var(--text-dim)", margin: 0 }}>entries</p>
            </div>
          </div>
        </div>

        {/* Theme toggle */}
        <div>
          <p style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>Appearance</p>
          <button onClick={toggleTheme} style={{ ...row, justifyContent: "space-between" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
              {theme === "dark" ? "Dark mode" : "Light mode"}
            </span>
            <span style={{ fontSize: "12px", color: "var(--accent-soft)" }}>Switch</span>
          </button>
        </div>

        {/* Menu */}
        <div>
          <p style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>Menu</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {menu.map((m) => {
              const Icon = m.icon;
              return (
                <button key={m.label} onClick={m.action} style={{ ...row, justifyContent: "space-between" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <Icon size={18} /> {m.label}
                  </span>
                  <ChevronRight size={16} style={{ color: "var(--text-dim)" }} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => { logout(); navigate("/"); }}
          style={{ ...row, marginTop: "auto", color: "#e07a52", border: "1px solid rgba(216,90,48,0.35)", background: "rgba(216,90,48,0.1)", justifyContent: "center", fontWeight: 600 }}
        >
          <LogOut size={18} /> Log out
        </button>
      </div>
    </>
  );
}

// Gear button for page headers — opens the account drawer.
export function AccountGear({ size = 38 }) {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event("mindspace:open-account"))}
      title="Account & settings"
      style={{
        width: `${size}px`, height: `${size}px`, borderRadius: "50%",
        background: "var(--card-2)", border: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", color: "var(--text-muted)", flexShrink: 0,
      }}
    >
      <Gear size={18} />
    </button>
  );
}
