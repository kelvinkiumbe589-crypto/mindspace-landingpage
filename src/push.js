// Browser Web Push subscription helper.
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";
const token = () => localStorage.getItem("mindspace_token");

export function pushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/**
 * Ask permission and subscribe this device to push. Returns one of:
 * "subscribed" | "denied" | "unsupported" | "unavailable" | "error".
 */
export async function enablePush() {
  if (!pushSupported()) return "unsupported";
  if (!token()) return "error";

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";

  try {
    const reg = await navigator.serviceWorker.ready;

    // Get the server's VAPID public key.
    const kr = await fetch(`${API_BASE}/api/push/public-key`);
    const { publicKey } = await kr.json();
    if (!publicKey) return "unavailable"; // push not configured on the server yet

    // Reuse an existing subscription or create one.
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    const res = await fetch(`${API_BASE}/api/push/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify(sub.toJSON()),
    });
    return res.ok ? "subscribed" : "error";
  } catch (e) {
    return "error";
  }
}
