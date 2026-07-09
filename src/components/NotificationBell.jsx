import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSupportUnread, openSupportChat } from "../useSupportUnread";

import { API_BASE } from "../lib/api";
const token = () => localStorage.getItem("mindspace_token");

/**
 * Unified notification bell: shows a badge for unread in-app notifications
 * (e.g. forum replies to your posts) combined with unread support replies,
 * and a dropdown listing them. Opening the panel marks notifications read.
 */
export default function NotificationBell({ size = 36 }) {
  const navigate = useNavigate();
  const supportUnread = useSupportUnread();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  const loadCount = async () => {
    if (!token()) return;
    try {
      const r = await fetch(`${API_BASE}/api/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (r.ok) {
        const d = await r.json();
        setUnread(d.count || 0);
      }
    } catch (e) {
      /* offline — keep current */
    }
  };

  const loadItems = async () => {
    if (!token()) return;
    try {
      const r = await fetch(`${API_BASE}/api/notifications`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (r.ok) setItems(await r.json());
    } catch (e) {
      /* offline */
    }
  };

  // Poll the unread count in the background so the badge stays fresh.
  useEffect(() => {
    loadCount();
    const id = setInterval(loadCount, 20000);
    return () => clearInterval(id);
  }, []);

  // Close the dropdown on an outside click.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      await loadItems();
      // Opening the panel clears the unread notifications.
      if (token()) {
        try {
          await fetch(`${API_BASE}/api/notifications/read-all`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token()}` },
          });
        } catch (e) {
          /* ignore */
        }
        setUnread(0);
      }
    }
  };

  const clickItem = (n) => {
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const fmt = (iso) => {
    try {
      return new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    } catch (e) {
      return "";
    }
  };

  const total = unread + supportUnread;

  const rowStyle = {
    display: "flex", flexDirection: "column", gap: "2px",
    padding: "10px", borderRadius: "10px", cursor: "pointer",
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={toggle}
        title="Notifications"
        className={total > 0 ? "support-glow" : undefined}
        style={{
          position: "relative", width: `${size}px`, height: `${size}px`, borderRadius: "50%",
          background: "var(--card)", border: "none", display: "flex", alignItems: "center",
          justifyContent: "center", color: "var(--text-muted)", cursor: "pointer",
        }}
      >
        <Bell size={18} />
        {total > 0 && (
          <span
            style={{
              position: "absolute", top: "-2px", right: "-2px", minWidth: "18px", height: "18px",
              padding: "0 5px", borderRadius: "9px", background: "#e5484d", color: "#fff",
              fontSize: "10px", fontWeight: 700, display: "flex", alignItems: "center",
              justifyContent: "center", border: "2px solid var(--bg)", lineHeight: 1,
            }}
          >
            {total > 9 ? "9+" : total}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute", right: 0, top: `${size + 8}px`, width: "320px", maxHeight: "420px",
            overflowY: "auto", background: "var(--elevated)", border: "1px solid var(--border)",
            borderRadius: "14px", boxShadow: "0 20px 50px rgba(0,0,0,0.4)", zIndex: 300, padding: "8px",
          }}
        >
          <div style={{ padding: "8px 10px", fontSize: "13px", fontWeight: 600, color: "var(--text-strong)" }}>
            Notifications
          </div>

          {supportUnread > 0 && (
            <div onClick={() => { setOpen(false); openSupportChat(); }} style={{ ...rowStyle, background: "rgba(83,74,183,0.08)" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-soft)" }}>
                💬 You have {supportUnread} new support {supportUnread === 1 ? "reply" : "replies"}
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: "#a89cf5" }}>Open chat →</p>
            </div>
          )}

          {items.length === 0 && supportUnread === 0 && (
            <p style={{ padding: "18px 10px", fontSize: "13px", color: "var(--text-dim)", textAlign: "center" }}>
              No notifications yet.
            </p>
          )}

          {items.map((n) => (
            <div
              key={n.id}
              onClick={() => clickItem(n)}
              className="hover-lift"
              style={{ ...rowStyle, opacity: n.read ? 0.65 : 1 }}
            >
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-soft)", lineHeight: 1.4 }}>{n.message}</p>
              <p style={{ margin: 0, fontSize: "11px", color: "var(--text-dim)" }}>{fmt(n.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
