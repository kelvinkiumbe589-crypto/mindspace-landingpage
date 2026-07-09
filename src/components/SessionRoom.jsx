import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";

import { API_BASE } from "../lib/api";
const WS_BASE = API_BASE.replace(/^http/, "ws");
const token = () => localStorage.getItem("mindspace_token");

/**
 * 1:1 WebRTC video room for an online session. Fetches ICE config + counterparty
 * name from the backend, connects to the signaling socket, and negotiates a peer
 * connection. Media flows peer-to-peer (relayed via TURN when needed).
 */
export default function SessionRoom({ bookingId, onClose }) {
  const [status, setStatus] = useState("connecting"); // connecting|waiting|connected|ended|error
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [remaining, setRemaining] = useState(null); // seconds of paid call time left

  const pcRef = useRef(null);
  const wsRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const cleanup = () => {
      try { wsRef.current && wsRef.current.close(); } catch (e) {}
      try { pcRef.current && pcRef.current.close(); } catch (e) {}
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
    };

    const wsSend = (obj) => {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
    };

    (async () => {
      // 1) Room config (auth + ICE) — 403/400 if not a party or not yet approved.
      let cfg;
      try {
        const r = await fetch(`${API_BASE}/api/sessions/${bookingId}/room`, {
          headers: { Authorization: `Bearer ${token()}` },
        });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Can't join this room yet.");
        cfg = await r.json();
      } catch (e) {
        if (!cancelled) { setError(e.message); setStatus("error"); }
        return;
      }
      if (cancelled) return;
      setName(cfg.counterpartyName || "");

      // 1b) Seed the remaining paid call time (the countdown).
      try {
        const sr = await fetch(`${API_BASE}/api/sessions/${bookingId}/call/state`, {
          headers: { Authorization: `Bearer ${token()}` },
        });
        if (sr.ok) { const sd = await sr.json(); if (typeof sd.remainingSeconds === "number") setRemaining(sd.remainingSeconds); }
      } catch (e) {}

      // 2) Local media
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (e) {
        if (!cancelled) { setError("Camera/microphone permission is required for the call."); setStatus("error"); }
        return;
      }
      if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      // 3) Peer connection
      const pc = new RTCPeerConnection({ iceServers: cfg.iceServers || [] });
      pcRef.current = pc;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      pc.ontrack = (ev) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = ev.streams[0];
        setStatus("connected");
      };
      pc.onicecandidate = (ev) => {
        if (ev.candidate) wsSend({ type: "ice", candidate: ev.candidate });
      };
      pc.onconnectionstatechange = () => {
        if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
          setStatus((s) => (s === "connected" ? "waiting" : s));
        }
      };

      // 4) Signaling
      const ws = new WebSocket(`${WS_BASE}/ws/session?bookingId=${bookingId}&token=${encodeURIComponent(token())}`);
      wsRef.current = ws;
      ws.onopen = () => { if (!cancelled) setStatus("waiting"); };
      ws.onerror = () => { if (!cancelled) { setError("Connection error."); setStatus("error"); } };
      ws.onmessage = async (evt) => {
        let msg;
        try { msg = JSON.parse(evt.data); } catch (e) { return; }
        try {
          if (msg.type === "peer-joined") {
            // We were here first → we make the offer.
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            wsSend({ type: "offer", sdp: pc.localDescription });
          } else if (msg.type === "offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            wsSend({ type: "answer", sdp: pc.localDescription });
          } else if (msg.type === "answer") {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          } else if (msg.type === "ice") {
            if (msg.candidate) await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
          } else if (msg.type === "peer-left") {
            setStatus("waiting");
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
          } else if (msg.type === "time-up") {
            setRemaining(0);
            setError("The paid call time for this session is up.");
            setStatus("ended");
          } else if (msg.type === "full") {
            setError("This room already has two people."); setStatus("error");
          } else if (msg.type === "error") {
            setError("You're not allowed in this room."); setStatus("error");
          }
        } catch (e) {
          /* ignore transient negotiation errors */
        }
      };
    })();

    return () => { cancelled = true; cleanup(); };
  }, [bookingId]);

  // Count the budget down only while actually connected (connected-time billing).
  useEffect(() => {
    if (status !== "connected" || remaining == null) return;
    const id = setInterval(() => {
      setRemaining((r) => (r == null ? r : Math.max(0, r - 1)));
    }, 1000);
    return () => clearInterval(id);
  }, [status, remaining == null]);

  // Budget hit zero mid-call — end it (the server force-closes too, this is the mirror).
  useEffect(() => {
    if (remaining === 0 && (status === "connected" || status === "waiting")) {
      setError("The paid call time for this session is up.");
      setStatus("ended");
    }
  }, [remaining, status]);

  const toggleMic = () => {
    const s = localStreamRef.current;
    if (!s) return;
    const on = !micOn;
    s.getAudioTracks().forEach((t) => (t.enabled = on));
    setMicOn(on);
  };
  const toggleCam = () => {
    const s = localStreamRef.current;
    if (!s) return;
    const on = !camOn;
    s.getVideoTracks().forEach((t) => (t.enabled = on));
    setCamOn(on);
  };
  const hangUp = () => { setStatus("ended"); onClose && onClose(); };

  const statusText = {
    connecting: "Connecting…",
    waiting: `Waiting for ${name || "the other person"} to join…`,
    connected: name || "Connected",
    ended: error || "Call ended",
    error: error || "Something went wrong",
  }[status];

  const fmtClock = (s) => {
    if (s == null) return "";
    const m = Math.floor(s / 60), sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#0a0a10", zIndex: 400, display: "flex", flexDirection: "column" }}>
      {/* Remote video (fills) */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover", background: "#000" }} />

        {status !== "connected" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "10px", color: "#c4c1f0", textAlign: "center", padding: "24px" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "rgba(83,74,183,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px" }}>🎥</div>
            <p style={{ fontSize: "15px", margin: 0 }}>{statusText}</p>
            {(status === "error" || status === "ended") && (
              <button onClick={hangUp} style={{ marginTop: "10px", padding: "10px 20px", borderRadius: "10px", border: "1px solid rgba(127,119,221,0.3)", background: "transparent", color: "#c4c1f0", cursor: "pointer" }}>Close</button>
            )}
          </div>
        )}

        {/* Local preview (PiP) */}
        <video ref={localVideoRef} autoPlay playsInline muted
          style={{ position: "absolute", bottom: "20px", right: "20px", width: "150px", height: "200px", objectFit: "cover", borderRadius: "14px", border: "2px solid rgba(127,119,221,0.4)", background: "#111", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }} />

        {/* Header */}
        <div style={{ position: "absolute", top: "16px", left: "16px", padding: "8px 14px", borderRadius: "999px", background: "rgba(0,0,0,0.45)", color: "#fff", fontSize: "13px", fontWeight: 600, backdropFilter: "blur(8px)" }}>
          {name ? `Session with ${name}` : "Online session"}
        </div>
        {remaining != null && (
          <div title="Paid call time remaining"
            style={{ position: "absolute", top: "16px", right: "16px", padding: "8px 14px", borderRadius: "999px", background: remaining <= 60 ? "rgba(229,72,77,0.85)" : "rgba(0,0,0,0.45)", color: "#fff", fontSize: "13px", fontWeight: 700, backdropFilter: "blur(8px)", fontVariantNumeric: "tabular-nums" }}>
            ⏳ {fmtClock(remaining)}
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", padding: "18px", background: "#0d0d14", borderTop: "1px solid rgba(127,119,221,0.15)" }}>
        <button onClick={toggleMic} title={micOn ? "Mute" : "Unmute"}
          style={ctrl(micOn)}>{micOn ? <Mic size={20} /> : <MicOff size={20} />}</button>
        <button onClick={toggleCam} title={camOn ? "Turn camera off" : "Turn camera on"}
          style={ctrl(camOn)}>{camOn ? <Video size={20} /> : <VideoOff size={20} />}</button>
        <button onClick={hangUp} title="Leave call"
          style={{ width: "54px", height: "54px", borderRadius: "50%", border: "none", background: "#e5484d", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <PhoneOff size={22} />
        </button>
      </div>
    </div>
  );
}

const ctrl = (on) => ({
  width: "54px", height: "54px", borderRadius: "50%", border: "1px solid rgba(127,119,221,0.3)",
  background: on ? "rgba(255,255,255,0.08)" : "rgba(229,72,77,0.25)", color: "#fff", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
});
