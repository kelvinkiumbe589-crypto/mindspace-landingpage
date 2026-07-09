// Profile-picture helpers.
//
// Model (see product decision): a "private" photo is client-only — it is stored
// in localStorage and only ever rendered to its owner, so nothing leaves the
// device. A "public" photo is additionally uploaded so chat partners can see it.
// If the backend doesn't support the avatar endpoints yet, sharing degrades
// quietly and the user still sees their own photo locally.

import { API_BASE } from "./api";
const USER_KEY = "mindspace_user";
const token = () => localStorage.getItem("mindspace_token");

export function getProfile() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveProfile(patch) {
  const next = { ...getProfile(), ...patch };
  localStorage.setItem(USER_KEY, JSON.stringify(next));
  // Let mounted components (drawer, sidebar) refresh without a reload.
  window.dispatchEvent(new Event("mindspace:profile-updated"));
  return next;
}

// Read a chosen image File, center-crop it to a square and downscale to a small
// JPEG data URL so it stays well under the localStorage budget (~15–25 KB).
export function fileToAvatarDataUrl(file, size = 256) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith("image/")) {
      reject(new Error("Please choose an image file."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That image couldn't be loaded."));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        const s = Math.min(img.width, img.height); // square crop from the center
        const sx = (img.width - s) / 2;
        const sy = (img.height - s) / 2;
        ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// Persist an avatar. Always stored locally; uploaded only when public + signed in.
// Returns { shared, reason } so the UI can explain what happened.
export async function saveAvatar(dataUrl, visibility) {
  saveProfile({ avatarUrl: dataUrl, avatarVisibility: visibility });
  if (visibility !== "public") return { shared: false, reason: "private" };
  if (!token()) return { shared: false, reason: "signed-out" };
  try {
    const res = await fetch(`${API_BASE}/api/profile/avatar`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ image: dataUrl, visibility }),
    });
    if (res.ok) {
      const d = await res.json().catch(() => null);
      if (d?.avatarUrl) saveProfile({ avatarUrl: d.avatarUrl });
      return { shared: true };
    }
    return { shared: false, reason: "server" };
  } catch {
    return { shared: false, reason: "offline" };
  }
}

export async function removeAvatar() {
  saveProfile({ avatarUrl: "" });
  if (!token()) return;
  try {
    await fetch(`${API_BASE}/api/profile/avatar`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token()}` },
    });
  } catch {
    /* nothing shared yet — safe to ignore */
  }
}

// Change visibility of an already-saved photo: going public shares the existing
// local photo; going private pulls it back from the server.
export async function setAvatarVisibility(visibility) {
  const prof = getProfile();
  saveProfile({ avatarVisibility: visibility });
  if (visibility === "public" && prof.avatarUrl) {
    return saveAvatar(prof.avatarUrl, "public");
  }
  if (visibility === "private") {
    await removeAvatarFromServerOnly();
  }
  return { shared: false, reason: visibility };
}

async function removeAvatarFromServerOnly() {
  if (!token()) return;
  try {
    await fetch(`${API_BASE}/api/profile/avatar`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token()}` },
    });
  } catch {
    /* ignore */
  }
}
