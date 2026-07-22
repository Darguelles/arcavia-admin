/**
 * Map tile-URL resolution (mirrors arcavia-frontend/src/lib/mapTiles.ts).
 *
 * The admin's global `MAP_TILE_URL` builds a MapTiler template from
 * `VITE_MAPTILER_KEY`; when no key is configured that URL ends in `key=` and
 * MapTiler answers 403 — the map renders blank. Fall back to public
 * OpenStreetMap tiles so the map always loads. OSM is fine for low-volume/dev
 * use only — configure a keyed provider via `VITE_MAPTILER_KEY` /
 * `VITE_MAP_TILE_URL` for production volume.
 */
export const FALLBACK_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

/** Returns a usable tile URL, substituting OSM for empty/placeholder/keyless inputs. */
export function resolveTileUrl(tileUrl: string | undefined): string {
  if (
    !tileUrl ||
    !tileUrl.includes('{z}') ||
    tileUrl.includes('example.com') ||
    // a keyed provider template left with an empty key (e.g. MapTiler `...?key=`)
    /[?&]key=(&|$)/.test(tileUrl)
  ) {
    return FALLBACK_TILE_URL
  }
  return tileUrl
}
