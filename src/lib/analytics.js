// Anonymous page-view tracking. We send only the route path and referrer, tagged
// with a random per-browser id so unique visitors can be counted without knowing
// who anyone is. No IP, no account, no personal data.

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";
const SID_KEY = "mindspace_sid";

function sessionId() {
  try {
    let id = localStorage.getItem(SID_KEY);
    if (!id) {
      id = (crypto?.randomUUID && crypto.randomUUID()) ||
        `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(SID_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

export function trackPageView(path) {
  try {
    const body = JSON.stringify({
      path: path || window.location.pathname,
      ref: document.referrer || "",
      sessionId: sessionId(),
    });
    // keepalive lets the request survive a navigation/tab close.
    fetch(`${API_BASE}/api/analytics/pageview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* analytics must never break the app */
  }
}
