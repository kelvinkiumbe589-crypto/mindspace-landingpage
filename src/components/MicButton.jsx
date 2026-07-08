import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";

/**
 * Voice-to-text button using the browser's Speech Recognition API. Calls
 * onText(transcript) with recognized speech (the caller appends it). Renders
 * nothing if the browser doesn't support speech recognition.
 */
export default function MicButton({ onText, lang = "en-US", size = 16 }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recRef = useRef(null);
  const onTextRef = useRef(onText);

  useEffect(() => { onTextRef.current = onText; });

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    const rec = new SR();
    rec.lang = lang;
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) text += e.results[i][0].transcript;
      }
      if (text) onTextRef.current(text.trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    return () => { try { rec.abort(); } catch (e) { /* ignore */ } };
  }, [lang]);

  const toggle = () => {
    const rec = recRef.current;
    if (!rec) return;
    if (listening) {
      try { rec.stop(); } catch (e) { /* ignore */ }
      setListening(false);
    } else {
      try { rec.start(); setListening(true); } catch (e) { setListening(false); }
    }
  };

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      title={listening ? "Stop recording" : "Speak your entry"}
      className={listening ? "mic-pulse" : undefined}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px",
        padding: "6px 10px", borderRadius: "999px", border: "1px solid var(--border)",
        background: listening ? "#e5484d" : "var(--card-2)",
        color: listening ? "#fff" : "var(--text-muted)", fontSize: "12px", fontWeight: 600, cursor: "pointer",
      }}
    >
      {listening ? <Square size={size - 2} /> : <Mic size={size} />}
      {listening ? "Listening…" : "Speak"}
    </button>
  );
}
