import { useEffect, useState } from "react";
import { X } from "lucide-react";

// New keys (v2) so anyone who dismissed the old banner sees it again once.
const NEVER_KEY = "mindspace_a2hs_never";
const SNOOZE_KEY = "mindspace_a2hs_snooze";
const SNOOZE_DAYS = 7;

/**
 * "Add to Home Screen" prompt. Android/Chrome gets a one-tap Add when the native
 * install event fires; if it doesn't (or on iPhone), we still show manual steps.
 * Close (X) snoozes for a week; "Don't show again" hides it permanently.
 */
export default function AddToHomeScreen() {
  const [deferred, setDeferred] = useState(null);
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState("install"); // install | ios | manual

  useEffect(() => {
    const standalone = window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone;
    if (standalone) return;                                   // already installed
    if (localStorage.getItem(NEVER_KEY)) return;              // opted out permanently
    const snoozeUntil = Number(localStorage.getItem(SNOOZE_KEY) || 0);
    if (snoozeUntil && Date.now() < snoozeUntil) return;      // snoozed

    const ua = window.navigator.userAgent || "";
    if (/iphone|ipad|ipod/i.test(ua)) {
      setMode("ios");
      const t = setTimeout(() => setShow(true), 2500);
      return () => clearTimeout(t);
    }

    let fired = false;
    const onPrompt = (e) => { e.preventDefault(); setDeferred(e); setMode("install"); setShow(true); fired = true; };
    const onInstalled = () => { setShow(false); localStorage.setItem(NEVER_KEY, "1"); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    // Fallback: if Chrome never fires the install event, still show manual steps.
    const t = setTimeout(() => { if (!fired) { setMode("manual"); setShow(true); } }, 6000);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      clearTimeout(t);
    };
  }, []);

  const snooze = () => { setShow(false); localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_DAYS * 86400000)); };
  const never = () => { setShow(false); localStorage.setItem(NEVER_KEY, "1"); };
  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    try { await deferred.userChoice; } catch (e) { /* ignore */ }
    setDeferred(null);
    setShow(false);
    localStorage.setItem(NEVER_KEY, "1");
  };

  if (!show) return null;

  const subtext = mode === "ios"
    ? "Tap the Share button, then “Add to Home Screen”."
    : mode === "manual"
      ? "Open your browser menu (⋮), then tap “Add to Home screen”."
      : "One tap — opens like an app, no download.";

  return (
    <div style={{
      position: "fixed", bottom: "16px", left: "16px", right: "16px", zIndex: 500,
      maxWidth: "440px", margin: "0 auto", background: "#17172a",
      border: "1px solid rgba(127,119,221,0.3)", borderRadius: "16px", padding: "14px 16px",
      boxShadow: "0 20px 50px rgba(0,0,0,0.5)", display: "flex", alignItems: "center", gap: "12px",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#534AB7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>🧠</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#f0eeff" }}>Add MindSpace to your home screen</p>
        <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#9d9bc4", lineHeight: 1.4 }}>{subtext}</p>
        <button onClick={never} style={{ marginTop: "6px", background: "none", border: "none", padding: 0, color: "#6b6990", fontSize: "11px", textDecoration: "underline", cursor: "pointer" }}>
          Don’t show again
        </button>
      </div>
      {mode === "install" && deferred && (
        <button onClick={install} style={{ padding: "9px 16px", borderRadius: "10px", border: "none", background: "#534AB7", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>Add</button>
      )}
      <button onClick={snooze} aria-label="Close" title="Close (shows again later)" style={{ background: "none", border: "none", color: "#9d9bc4", cursor: "pointer", padding: "4px", flexShrink: 0 }}>
        <X size={18} />
      </button>
    </div>
  );
}
