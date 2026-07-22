export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
export const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY ?? ''
export const MAP_TILE_URL =
  import.meta.env.VITE_MAP_TILE_URL ??
  `https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`

// Default admin credentials used to pre-fill the login form for local runs.
// The panel still authenticates against the real API; the backend must have
// this admin account seeded. Override via env for other environments.
export const DEFAULT_ADMIN_EMAIL = import.meta.env.VITE_DEFAULT_ADMIN_EMAIL ?? 'admin@arcavia.com'
export const DEFAULT_ADMIN_PASSWORD = import.meta.env.VITE_DEFAULT_ADMIN_PASSWORD ?? '12345678'
