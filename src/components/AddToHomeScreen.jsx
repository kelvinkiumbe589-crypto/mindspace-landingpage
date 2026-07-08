import { useEffect, useState } from "react";
import { X } from "lucide-react";

const DISMISS_KEY = "mindspace_a2hs_dismissed";

/**
 * Gentle "Add to Home Screen" prompt. On Android/desktop Chrome it captures the
 * native install event and offers a one-tap Add. On iPhone (no such event) it
 * shows the Share → Add to Home Screen steps. Hidden once installed or dismissed.
 */
export default function AddToHomeScreen() {
  const [deferred, setDeferred] = useState(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Already installed (opened from the home-screen icon)? Never show.
    const standalone = window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone;
    if (standalone) return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    const ua = window.navigator.userAgent || "";
    const ios = /iphone|ipad|ipod/i.test(ua);
    if (ios) {
      setIsIOS(true);
      const t = setTimeout(() => setShow(true), 3000); // let the page settle first
      return () => clearTimeout(t);
    }

    const onPrompt = (e) => {
      e.preventDefault();      // stop Chrome's mini-infobar; we show our own
      setDeferred(e);
      setShow(true);
    };
    const onInstalled = () => { setShow(false); localStorage.setItem(DISMISS_KEY, "1"); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => { setShow(false); localStorage.setItem(DISMISS_KEY, "1"); };

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    try { await deferred.userChoice; } catch (e) { /* ignore */ }
    setDeferred(null);
    setShow(false);
    localStorage.setItem(DISMISS_KEY, "1");
  };

  if (!show) return null;

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
        <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#9d9bc4", lineHeight: 1.4 }}>
          {isIOS ? "Tap the Share button, then “Add to Home Screen”." : "One tap — opens like an app, no download."}
        </p>
      </div>
      {!isIOS && (
        <button onClick={install} style={{ padding: "9px 16px", borderRadius: "10px", border: "none", background: "#534AB7", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>Add</button>
      )}
      <button onClick={dismiss} aria-label="Dismiss" style={{ background: "none", border: "none", color: "#9d9bc4", cursor: "pointer", padding: "4px", flexShrink: 0 }}>
        <X size={18} />
      </button>
    </div>
  );
}
