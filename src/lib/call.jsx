// App-wide "calling" layer for online sessions.
//
// Keeps a persistent socket to the backend so an incoming call rings instantly
// (with an Accept/Decline popup) from any page, and owns the single SessionRoom
// overlay so a call survives navigation. Web Push (see push.js + sw.js) covers
// the case where the tab is closed/backgrounded.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { PhoneCall, PhoneOff } from "lucide-react";
import { API_BASE } from "./api";
import SessionRoom from "../components/SessionRoom";

const WS_BASE = API_BASE.replace(/^http/, "ws");
const token = () => localStorage.getItem("mindspace_token");
const loggedIn = () => !!token();

const CallContext = createContext(null);
export const useCall = () => useContext(CallContext) || {};

async function callApi(bookingId, action) {
  const path = action ? `/api/sessions/${bookingId}/call/${action}` : `/api/sessions/${bookingId}/call`;
  const r = await fetch(`${API_BASE}${path}`, {
    method: action === "state" ? "GET" : "POST",
    headers: { Authorization: `Bearer ${token()}` },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "Call failed");
  return data;
}

// A short repeating ring tone via Web Audio (best-effort — browsers may block
// audio until the user has interacted with the page; the visual popup + phone
// push notification still ring regardless).
function useRingtone() {
  const ctxRef = useRef(null);
  const timerRef = useRef(null);
  const stop = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    try { navigator.vibrate && navigator.vibrate(0); } catch (e) {}
  }, []);
  const start = useCallback(() => {
    stop();
    const beep = () => {
      try {
        if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        const ac = ctxRef.current;
        if (ac.state === "suspended") ac.resume().catch(() => {});
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.frequency.value = 480;
        gain.gain.setValueAtTime(0.0001, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.2, ac.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.7);
        osc.connect(gain); gain.connect(ac.destination);
        osc.start(); osc.stop(ac.currentTime + 0.75);
      } catch (e) {}
      try { navigator.vibrate && navigator.vibrate([300, 200, 300]); } catch (e) {}
    };
    beep();
    timerRef.current = setInterval(beep, 2000);
  }, [stop]);
  useEffect(() => stop, [stop]);
  return { start, stop };
}

export function CallProvider({ children }) {
  const [incoming, setIncoming] = useState(null); // { bookingId, fromName }
  const [room, setRoom] = useState(null);         // { bookingId } — the open call
  const [toast, setToast] = useState("");
  const wsRef = useRef(null);
  const ring = useRingtone();

  const clearToast = () => setToast("");
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(clearToast, 4000);
    return () => clearTimeout(id);
  }, [toast]);

  // Persistent signalling socket for call events (independent of the Messages page).
  useEffect(() => {
    if (!loggedIn()) return;
    let closed = false;
    let retry;
    const connect = () => {
      if (closed) return;
      const ws = new WebSocket(`${WS_BASE}/ws/chat?token=${encodeURIComponent(token())}`);
      wsRef.current = ws;
      ws.onmessage = (evt) => {
        let m; try { m = JSON.parse(evt.data); } catch (e) { return; }
        if (m.type === "call-invite") {
          setRoom((cur) => cur); // no-op; keep current room
          setIncoming({ bookingId: m.bookingId, fromName: m.fromName || "Someone" });
        } else if (m.type === "call-canceled") {
          setIncoming((cur) => (cur && cur.bookingId === m.bookingId ? null : cur));
        } else if (m.type === "call-declined") {
          setToast("Call declined.");
        }
      };
      ws.onclose = () => {
        wsRef.current = null;
        if (!closed) retry = setTimeout(connect, 3000);
      };
      ws.onerror = () => { try { ws.close(); } catch (e) {} };
    };
    connect();
    return () => { closed = true; clearTimeout(retry); try { wsRef.current && wsRef.current.close(); } catch (e) {} };
  }, []);

  // Ring while there's a pending incoming call.
  useEffect(() => {
    if (incoming) ring.start(); else ring.stop();
  }, [incoming, ring]);

  // Deep link from a push notification: /?call=<bookingId> → show the accept popup.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const id = p.get("call");
    if (id && loggedIn()) {
      setIncoming({ bookingId: id, fromName: "your session" });
      // Strip the param so a refresh doesn't re-trigger it.
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete("call");
        window.history.replaceState({}, "", url.toString());
      } catch (e) {}
    }
  }, []);

  // Start a call to the other party, then open the room and wait for them.
  const startCall = useCallback(async (bookingId) => {
    try {
      await callApi(bookingId, null);
      setRoom({ bookingId });
    } catch (e) {
      setToast(e.message || "Couldn't start the call.");
    }
  }, []);

  // Rejoin a call already in progress (peer still on the line) — no ring.
  const rejoin = useCallback((bookingId) => setRoom({ bookingId }), []);

  const acceptIncoming = useCallback(async () => {
    if (!incoming) return;
    const bookingId = incoming.bookingId;
    ring.stop();
    setIncoming(null);
    try { await callApi(bookingId, "accept"); } catch (e) {}
    setRoom({ bookingId });
  }, [incoming, ring]);

  const declineIncoming = useCallback(async () => {
    if (!incoming) return;
    const bookingId = incoming.bookingId;
    ring.stop();
    setIncoming(null);
    try { await callApi(bookingId, "decline"); } catch (e) {}
  }, [incoming, ring]);

  const closeRoom = useCallback(() => setRoom(null), []);

  return (
    <CallContext.Provider value={{ startCall, rejoin, closeRoom }}>
      {children}
      {room && <SessionRoom bookingId={room.bookingId} onClose={closeRoom} />}
      {incoming && !room && (
        <IncomingCallModal fromName={incoming.fromName} onAccept={acceptIncoming} onDecline={declineIncoming} />
      )}
      {toast && (
        <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", zIndex: 600,
          background: "rgba(20,20,28,0.95)", color: "#fff", padding: "12px 18px", borderRadius: "12px",
          fontSize: "13px", border: "1px solid rgba(127,119,221,0.3)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
          {toast}
        </div>
      )}
    </CallContext.Provider>
  );
}

function IncomingCallModal({ fromName, onAccept, onDecline }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(6,6,12,0.82)", backdropFilter: "blur(6px)", zIndex: 550,
      display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "340px", background: "#14141c", border: "1px solid rgba(127,119,221,0.25)",
        borderRadius: "22px", padding: "30px 24px", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
        <div style={{ width: "76px", height: "76px", borderRadius: "50%", margin: "0 auto 16px",
          background: "rgba(83,74,183,0.25)", display: "flex", alignItems: "center", justifyContent: "center",
          color: "#b7b0f5", animation: "callpulse 1.4s ease-in-out infinite" }}>
          <PhoneCall size={32} />
        </div>
        <p style={{ fontSize: "13px", color: "#9a95c9", margin: "0 0 4px" }}>Incoming session call</p>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#fff", margin: "0 0 26px" }}>{fromName}</h2>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
          <button onClick={onDecline} title="Decline" style={ansBtn("#e5484d")}><PhoneOff size={24} /></button>
          <button onClick={onAccept} title="Accept" style={ansBtn("#1D9E75")}><PhoneCall size={24} /></button>
        </div>
        <style>{`@keyframes callpulse {0%,100%{box-shadow:0 0 0 0 rgba(83,74,183,0.4)}50%{box-shadow:0 0 0 14px rgba(83,74,183,0)}}`}</style>
      </div>
    </div>
  );
}

const ansBtn = (bg) => ({ width: "62px", height: "62px", borderRadius: "50%", border: "none", background: bg,
  color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" });
