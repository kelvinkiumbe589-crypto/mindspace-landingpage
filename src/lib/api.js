// Single source of truth for the backend URL.
//
// Locally this is localhost:8080. In a *production* build we never allow a
// localhost fallback: if VITE_API_BASE is missing or stale on the host (Vercel),
// silently talking to localhost would break the live site for every visitor — so
// we fall back to the deployed backend instead. A non-localhost VITE_API_BASE
// still overrides everything.
const RAW = import.meta.env.VITE_API_BASE || "http://localhost:8080";

export const API_BASE = import.meta.env.PROD && RAW.includes("localhost")
  ? "https://mindspace-backend-vyqq.onrender.com"
  : RAW;
