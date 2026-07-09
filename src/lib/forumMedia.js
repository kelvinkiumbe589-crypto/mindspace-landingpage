// Forum post media helpers.
//
// The backend has no object storage, so — like profile avatars (see lib/avatar.js)
// — media is stored as a data URL in a Postgres TEXT column. Images are downscaled
// client-side to keep them small; videos are capped by file size since we can't
// re-encode them in the browser cheaply.

// Longest edge an uploaded image is scaled down to. Big enough to look sharp in a
// post card, small enough to keep the data URL well under ~200 KB.
const IMAGE_MAX_EDGE = 1280;
const IMAGE_QUALITY = 0.82;

// Hard cap on the *source* video file. base64 inflates ~33%, so a 10 MB clip
// becomes a ~13 MB string — heavy but acceptable at this app's scale.
const VIDEO_MAX_BYTES = 10 * 1024 * 1024;

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });

// Downscale an image File to a JPEG data URL, preserving aspect ratio.
function imageToDataUrl(file) {
  return new Promise((resolve, reject) => {
    readAsDataUrl(file).then((src) => {
      const img = new Image();
      img.onerror = () => reject(new Error("That image couldn't be loaded."));
      img.onload = () => {
        const scale = Math.min(1, IMAGE_MAX_EDGE / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", IMAGE_QUALITY));
      };
      img.src = src;
    }, reject);
  });
}

// Turn a chosen File into { mediaUrl, mediaType } for a forum post, or throw a
// user-facing error. mediaType is "image" or "video".
export async function fileToPostMedia(file) {
  if (!file) throw new Error("No file selected.");
  const type = file.type || "";

  if (type.startsWith("image/")) {
    const mediaUrl = await imageToDataUrl(file);
    return { mediaUrl, mediaType: "image" };
  }

  if (type.startsWith("video/")) {
    if (file.size > VIDEO_MAX_BYTES) {
      throw new Error("That video is too large — please keep videos under 10 MB.");
    }
    const mediaUrl = await readAsDataUrl(file);
    return { mediaUrl, mediaType: "video" };
  }

  throw new Error("Please choose an image or video file.");
}
