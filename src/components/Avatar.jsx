import { useState } from "react";

// Deterministic fallback color from a name, so a member without a photo always
// gets the same colored initial across the app.
const PALETTE = ["#4f46e5", "#059669", "#ea580c", "#e11d48", "#0284c7", "#9333ea"];
export function colorFor(name) {
  let h = 0;
  for (const ch of name || "") h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

/**
 * Round avatar used app-wide. Shows the photo when `src` is present (and loads
 * successfully), otherwise the colored initial. Optionally shows a presence dot.
 *
 *  name     display name (drives the initial + fallback color)
 *  src      photo URL or data URL (optional)
 *  size     diameter in px
 *  showDot  render a presence dot in the corner
 *  online   dot color: green when true, grey when false
 *  ring     color of the dot's ring (match the surrounding background)
 */
export default function Avatar({
  name = "",
  src,
  size = 40,
  showDot = false,
  online = false,
  ring = "var(--bg)",
  style,
}) {
  const [broken, setBroken] = useState(false);
  const showImg = src && !broken;
  const initial = (name.trim().charAt(0) || "?").toUpperCase();
  const dot = Math.max(10, Math.round(size * 0.3));

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0, ...style }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          overflow: "hidden",
          background: showImg ? "var(--card-2)" : colorFor(name),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          color: "#fff",
          fontSize: Math.round(size * 0.42),
        }}
      >
        {showImg ? (
          <img
            src={src}
            alt={name}
            onError={() => setBroken(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          initial
        )}
      </div>
      {showDot && (
        <span
          title={online ? "Active now" : "Offline"}
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: dot,
            height: dot,
            borderRadius: "50%",
            background: online ? "#22c55e" : "#71717a",
            border: `2px solid ${ring}`,
            boxSizing: "border-box",
          }}
        />
      )}
    </div>
  );
}
