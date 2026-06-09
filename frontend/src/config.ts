// Centralized backend URL for both REST calls and the socket.io connection.
//
// Set VITE_API_URL at build time (Render injects it for the static site build).
// - Local dev: leave it unset and we fall back to http://localhost:3000.
// - Prod: set it to your backend, e.g. https://whiteboard-backend.onrender.com
//   (a bare host like whiteboard-backend.onrender.com is also accepted and
//   upgraded to https://).
function resolveApiUrl(): string {
  const raw = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (!raw) return 'http://localhost:3000';
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withScheme.replace(/\/+$/, ''); // strip trailing slash(es)
}

export const API_URL = resolveApiUrl();
