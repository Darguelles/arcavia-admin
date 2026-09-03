import { useCallback, useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MAP_TILE_URL } from '../config'
import { resolveTileUrl } from '../lib/mapTiles'
import { t } from '../lib/i18n'

// Fix Leaflet's default marker-icon path with bundlers (same as MapPicker).
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export interface BoundingBox {
  bbox_north: number
  bbox_south: number
  bbox_east: number
  bbox_west: number
  center_lat: number
  center_lng: number
}

interface MapAreaPickerProps {
  value: Partial<BoundingBox>
  onChange: (bbox: BoundingBox) => void
  height?: string
}

const DEFAULT_CENTER: L.LatLngExpression = [-12.0464, -77.0428] // Lima fallback

function boxComplete(b: Partial<BoundingBox>): b is BoundingBox {
  return (
    b.bbox_north !== undefined &&
    b.bbox_south !== undefined &&
    b.bbox_east !== undefined &&
    b.bbox_west !== undefined &&
    b.center_lat !== undefined &&
    b.center_lng !== undefined
  )
}

function hasBbox(b: Partial<BoundingBox>): boolean {
  return (
    b.bbox_north !== undefined &&
    b.bbox_south !== undefined &&
    b.bbox_east !== undefined &&
    b.bbox_west !== undefined
  )
}

/** Stable identity for a (possibly partial) box, used to tell our own echoes apart. */
function boxKey(b: Partial<BoundingBox>): string {
  return [b.bbox_north, b.bbox_south, b.bbox_east, b.bbox_west, b.center_lat, b.center_lng].join(
    ','
  )
}

/**
 * Map picker for city bounding box + center pin (spec §6.1).
 * Operator draws a rectangle and drops a center pin — no numeric entry. Tiles
 * fall back to OpenStreetMap when no MapTiler key is configured, and the view
 * recenters when the parent sets a new area (e.g. after picking a city/state).
 */
export function MapAreaPicker({ value, onChange, height = '400px' }: MapAreaPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const rectRef = useRef<L.Rectangle | null>(null)
  const previewRef = useRef<L.Rectangle | null>(null)
  const centerRef = useRef<L.Marker | null>(null)
  const boxRef = useRef<Partial<BoundingBox>>(value)
  // Key of the last box we emitted or synced — lets the sync effect ignore its
  // own echo (form value round-tripping back) and only react to real changes.
  const emittedRef = useRef<string>('')
  const firstCornerRef = useRef<L.LatLng | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const emit = useCallback(() => {
    const b = boxRef.current
    if (boxComplete(b)) {
      emittedRef.current = boxKey(b)
      onChangeRef.current(b)
    }
  }, [])

  const drawRect = useCallback((north: number, south: number, east: number, west: number) => {
    const map = mapRef.current
    if (!map) return
    if (rectRef.current) rectRef.current.remove()
    rectRef.current = L.rectangle(
      [
        [south, west],
        [north, east],
      ],
      // Gold accent (design token --color-gold); Leaflet paints on canvas, so
      // the hex is unavoidable here.
      { color: '#b19071', weight: 2, fillOpacity: 0.1 }
    ).addTo(map)
  }, [])

  const placeCenter = useCallback(
    (lat: number, lng: number) => {
      const map = mapRef.current
      if (!map) return
      if (centerRef.current) {
        centerRef.current.setLatLng([lat, lng])
      } else {
        const marker = L.marker([lat, lng], {
          draggable: true,
          title: 'Centro de la ciudad',
        }).addTo(map)
        marker.on('dragend', () => {
          const pos = marker.getLatLng()
          boxRef.current = { ...boxRef.current, center_lat: pos.lat, center_lng: pos.lng }
          emit()
        })
        centerRef.current = marker
      }
    },
    [emit]
  )

  // Create the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const initialCenter: L.LatLngExpression =
      value.center_lat !== undefined && value.center_lng !== undefined
        ? [value.center_lat, value.center_lng]
        : DEFAULT_CENTER

    const map = L.map(containerRef.current).setView(initialCenter, 11)
    mapRef.current = map

    L.tileLayer(resolveTileUrl(MAP_TILE_URL), { attribution: '© OpenStreetMap' }).addTo(map)

    // The container is sized by the surrounding layout after mount; recompute so
    // Leaflet doesn't latch onto a 0/stale size and render blank grey tiles.
    const invalidateTimer = setTimeout(() => map.invalidateSize(), 0)

    boxRef.current = value
    if (hasBbox(value)) {
      drawRect(value.bbox_north!, value.bbox_south!, value.bbox_east!, value.bbox_west!)
    }
    if (value.center_lat !== undefined && value.center_lng !== undefined) {
      placeCenter(value.center_lat, value.center_lng)
    }
    emittedRef.current = boxKey(value)

    // Rubber-band drawing: the first click anchors a corner, the rectangle
    // follows the cursor live, and the second click drops the opposite corner.
    const clearPreview = () => {
      previewRef.current?.remove()
      previewRef.current = null
      firstCornerRef.current = null
      map.getContainer().style.cursor = ''
    }

    map.on('click', (e: L.LeafletMouseEvent) => {
      if (!firstCornerRef.current) {
        firstCornerRef.current = e.latlng
        map.getContainer().style.cursor = 'crosshair'
        return
      }
      const north = Math.max(firstCornerRef.current.lat, e.latlng.lat)
      const south = Math.min(firstCornerRef.current.lat, e.latlng.lat)
      const east = Math.max(firstCornerRef.current.lng, e.latlng.lng)
      const west = Math.min(firstCornerRef.current.lng, e.latlng.lng)
      boxRef.current = {
        ...boxRef.current,
        bbox_north: north,
        bbox_south: south,
        bbox_east: east,
        bbox_west: west,
      }
      // Sin centro fijado aún, úsese el del rectángulo — dos clicks bastan;
      // el click derecho o arrastrar el pin lo ajustan después.
      if (boxRef.current.center_lat === undefined || boxRef.current.center_lng === undefined) {
        boxRef.current.center_lat = (north + south) / 2
        boxRef.current.center_lng = (east + west) / 2
      }
      clearPreview()
      drawRect(north, south, east, west)
      placeCenter(boxRef.current.center_lat, boxRef.current.center_lng)
      emit()
    })

    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      const anchor = firstCornerRef.current
      if (!anchor) return
      const bounds = L.latLngBounds(anchor, e.latlng)
      if (previewRef.current) {
        previewRef.current.setBounds(bounds)
      } else {
        previewRef.current = L.rectangle(bounds, {
          color: '#b19071',
          weight: 2,
          dashArray: '6 4',
          fillOpacity: 0.06,
          interactive: false,
        }).addTo(map)
      }
    })

    // Escape cancels a rectangle in progress.
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape' && firstCornerRef.current) clearPreview()
    }
    window.addEventListener('keydown', onKeyDown)

    // Right-click fixes the city center.
    map.on('contextmenu', (e: L.LeafletMouseEvent) => {
      boxRef.current = { ...boxRef.current, center_lat: e.latlng.lat, center_lng: e.latlng.lng }
      placeCenter(e.latlng.lat, e.latlng.lng)
      emit()
    })

    return () => {
      clearTimeout(invalidateTimer)
      window.removeEventListener('keydown', onKeyDown)
      map.remove()
      mapRef.current = null
      rectRef.current = null
      previewRef.current = null
      centerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // React to external area changes (e.g. selecting a city/state) — redraw and
  // recenter the view. Skips our own emitted values to avoid feedback loops.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const key = boxKey(value)
    if (key === emittedRef.current) return

    boxRef.current = { ...value }
    if (hasBbox(value)) {
      drawRect(value.bbox_north!, value.bbox_south!, value.bbox_east!, value.bbox_west!)
    }
    if (value.center_lat !== undefined && value.center_lng !== undefined) {
      placeCenter(value.center_lat, value.center_lng)
    }
    if (hasBbox(value)) {
      map.fitBounds([
        [value.bbox_south!, value.bbox_west!],
        [value.bbox_north!, value.bbox_east!],
      ])
    } else if (value.center_lat !== undefined && value.center_lng !== undefined) {
      map.setView([value.center_lat, value.center_lng], 12)
    }
    emittedRef.current = key
    // Depend on the individual box fields, not the `value` object identity
    // (which is new every render), so this only runs on real area changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    value.bbox_north,
    value.bbox_south,
    value.bbox_east,
    value.bbox_west,
    value.center_lat,
    value.center_lng,
    drawRect,
    placeCenter,
  ])

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={containerRef}
        style={{ height }}
        className="rounded-card border border-line-strong overflow-hidden min-w-[300px]"
        aria-label="Mapa para definir el área de la ciudad"
      />
      <p className="text-[13px] leading-[19px] text-muted">
        <strong>Un click</strong> ancla la esquina y el cuadro sigue al cursor;{' '}
        <strong>un segundo click</strong> lo suelta (Esc cancela). <strong>Click derecho</strong>{' '}
        para fijar el centro. {t.cityMapAreaHint}
      </p>
    </div>
  )
}
