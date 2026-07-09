// Mood entry service: uses the backend DB when the user is logged in
// (JWT in localStorage), and falls back to a localStorage cache otherwise.

import { API_BASE } from "./lib/api";
const ENTRIES_KEY = "mindspace_entries";

const MOODS = [
  { emoji: "😢", value: 2 },
  { emoji: "😟", value: 4 },
  { emoji: "😐", value: 5 },
  { emoji: "🙂", value: 7 },
  { emoji: "😄", value: 9 },
];

export function emojiForScore(score) {
  let closest = MOODS[0];
  MOODS.forEach((m) => {
    if (Math.abs(m.value - score) < Math.abs(closest.value - score)) closest = m;
  });
  return closest.emoji;
}

export function formatDate(d) {
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
}

function readLocal() {
  try {
    const parsed = JSON.parse(localStorage.getItem(ENTRIES_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}
function writeLocal(list) {
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(list));
}
function token() {
  return localStorage.getItem("mindspace_token");
}

// Normalise a record (backend or local) into the shape the pages render.
function normalize(m) {
  const ts = m.loggedAt ? new Date(m.loggedAt).getTime() : (m.timestamp ?? Date.now());
  const tags = typeof m.emotions === "string"
    ? m.emotions.split(",").map((s) => s.trim()).filter(Boolean)
    : (m.tags || []);
  return {
    id: m.id,
    timestamp: ts,
    date: formatDate(new Date(ts)),
    moodScore: m.moodScore,
    emoji: m.emoji || emojiForScore(m.moodScore ?? 5),
    text: m.journalText ?? m.text ?? "",
    tags,
  };
}

export async function loadMoods() {
  const t = token();
  if (t) {
    try {
      const res = await fetch(`${API_BASE}/api/moods/me`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const data = await res.json();
        const list = (Array.isArray(data) ? data : [])
          .map(normalize)
          .sort((a, b) => b.timestamp - a.timestamp);
        writeLocal(list); // cache for offline / instant paint
        return list;
      }
    } catch (e) {
      // fall through to local
    }
  }
  return readLocal();
}

export async function saveMood({ moodScore, tags = [], text = "", emoji }) {
  const now = new Date();
  const local = {
    id: now.getTime(), timestamp: now.getTime(), date: formatDate(now),
    moodScore, emoji: emoji || emojiForScore(moodScore), text, tags,
  };
  writeLocal([local, ...readLocal()]); // optimistic

  const t = token();
  if (t) {
    try {
      const res = await fetch(`${API_BASE}/api/moods`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body: JSON.stringify({ moodScore, emotions: tags.join(","), journalText: text }),
      });
      if (res.ok) return await loadMoods(); // authoritative refresh from DB
    } catch (e) {
      // keep optimistic local copy
    }
  }
  return readLocal();
}

export async function deleteMood(id) {
  writeLocal(readLocal().filter((e) => e.id !== id)); // optimistic
  const t = token();
  if (t) {
    try {
      await fetch(`${API_BASE}/api/moods/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${t}` },
      });
      return await loadMoods();
    } catch (e) {
      // keep local removal
    }
  }
  return readLocal();
}
