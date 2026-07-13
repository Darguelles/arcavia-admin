export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
export const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY ?? ''
export const MAP_TILE_URL =
  import.meta.env.VITE_MAP_TILE_URL ??
  `https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`
