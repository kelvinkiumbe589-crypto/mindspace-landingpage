import { useEffect, useState } from "react";

/**
 * Reflects the number of unread admin replies. The SupportChat widget is the
 * single source of truth — it broadcasts "mindspace:support-unread" whenever the
 * count changes and stashes the latest value on window for late-mounting listeners.
 */
export function useSupportUnread() {
  const [unread, setUnread] = useState(() => window.__mindspaceUnread || 0);

  useEffect(() => {
    const handler = (e) => setUnread(e.detail || 0);
    window.addEventListener("mindspace:support-unread", handler);
    // pick up the current value in case SupportChat dispatched before we mounted
    setUnread(window.__mindspaceUnread || 0);
    return () => window.removeEventListener("mindspace:support-unread", handler);
  }, []);

  return unread;
}

/** Ask the SupportChat widget to open (used by the notification bell). */
export function openSupportChat() {
  window.dispatchEvent(new CustomEvent("mindspace:open-support"));
}
