// Simple client-side auth helpers backed by localStorage.
// A session exists when we have a JWT (email/password login) or a stored user
// (Google OAuth). The OAuth callback arrives as ?name=&email= query params, so
// we treat those as a valid in-progress session too (the Dashboard stores them).

export function isAuthenticated() {
  if (localStorage.getItem("mindspace_token") || localStorage.getItem("mindspace_user")) {
    return true;
  }
  const params = new URLSearchParams(window.location.search);
  return params.has("name") || params.has("email");
}

export function logout() {
  localStorage.removeItem("mindspace_token");
  localStorage.removeItem("mindspace_user");
}
