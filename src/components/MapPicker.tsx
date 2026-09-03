import { useCallback, useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MAP_TILE_URL } from '../config'
import { resolveTileUrl } from '../lib/mapTiles'
import { t } from '../lib/i18n'

// Fix Leaflet's default icon path issue with bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Used only until real coordinates arrive (e.g. a brand-new waypoint before its
// mission's city resolves). Once lat/lng are known the map recenters onto them.
const FALLBACK_CENTER: L.LatLngExpression = [-12.0464, -77.0428]

function hasCoords(v: number | undefined): v is number {
  return v !== undefined && Number.isFinite(v)
}

interface MapPickerProps {
  lat: number | undefined
  lng: number | undefined
  toleranceRadius: number
  onChange: (lat: number, lng: number) => void
  readOnly?: boolean
  height?: string
}

/**
 * Single-pin map picker for a waypoint's location.
 * Operator drags/clicks to set lat/lng — no numeric entry (spec §6.4).
 * Draws a tolerance circle to visualise the catch area.
 *
 * `lat`/`lng` are controlled and frequently resolve *after* mount (the initial
 * pin is dropped at the mission's city center once that city loads), so the map
 * recenters the first time real coordinates arrive rather than staying on the
 * fallback center.
 */
export function MapPicker({
  lat,
  lng,
  toleranceRadius,
  onChange,
  readOnly = false,
  height = '360px',
}: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const circleRef = useRef<L.Circle | null>(null)
  // Read the latest props from inside the (mount-once) map handlers.
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const radiusRef = useRef(toleranceRadius)
  radiusRef.current = toleranceRadius

  const updateCircle = useCallback((cLat: number, cLng: number) => {
    const map = mapRef.current
    if (!map) return
    if (circleRef.current) {
      circleRef.current.setLatLng([cLat, cLng])
      circleRef.current.setRadius(radiusRef.current)
    } else {
      circleRef.current = L.circle([cLat, cLng], {
        radius: radiusRef.current,
        color: '#6366f1',
        fillColor: '#6366f1',
        fillOpacity: 0.15,
      }).addTo(map)
    }
  }, [])

  const placeMarker = useCallback(
    (newLat: number, newLng: number) => {
      const map = mapRef.current
      if (!map) return
      if (markerRef.current) {
        markerRef.current.setLatLng([newLat, newLng])
      } else {
        const marker = L.marker([newLat, newLng], { draggable: !readOnly })
        marker.addTo(map)
        if (!readOnly) {
          marker.on('dragend', () => {
            const pos = marker.getLatLng()
            updateCircle(pos.lat, pos.lng)
            onChangeRef.current(pos.lat, pos.lng)
          })
        }
        markerRef.current = marker
      }
      updateCircle(newLat, newLng)
    },
    [readOnly, updateCircle]
  )

  // Create the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const centered = hasCoords(lat) && hasCoords(lng)
    const map = L.map(containerRef.current).setView(
      centered ? [lat, lng] : FALLBACK_CENTER,
      centered ? 16 : 12
    )
    mapRef.current = map

    L.tileLayer(resolveTileUrl(MAP_TILE_URL), { attribution: '© OpenStreetMap' }).addTo(map)

    // The container is sized by the surrounding flex/grid layout after mount;
    // recompute so Leaflet doesn't latch onto a 0/stale size and render blank.
    const invalidateTimer = setTimeout(() => map.invalidateSize(), 0)

    if (!readOnly) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        placeMarker(e.latlng.lat, e.latlng.lng)
        onChangeRef.current(e.latlng.lat, e.latlng.lng)
      })
    }

    if (centered) placeMarker(lat, lng)

    return () => {
      clearTimeout(invalidateTimer)
      map.remove()
      mapRef.current = null
      markerRef.current = null
      circleRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep the pin in sync with the controlled lat/lng. These commonly arrive
  // after mount (the pin is dropped at the mission's city center once the city
  // resolves), so recenter the map the first time real coordinates appear — but
  // not on later user clicks/drags, which shouldn't yank the view around.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !hasCoords(lat) || !hasCoords(lng)) return
    const firstFix = !markerRef.current
    placeMarker(lat, lng)
    if (firstFix) map.setView([lat, lng], 16)
  }, [lat, lng, placeMarker])

  // Update circle radius when tolerance changes
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(toleranceRadius)
    }
  }, [toleranceRadius])

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={containerRef}
        style={{ height }}
        className="rounded-card border border-line-strong overflow-hidden min-w-[300px]"
        aria-label="Mapa para colocar el pin de ubicación"
      />
      {!readOnly && <p className="text-[13px] leading-[19px] text-muted">{t.mapPinHint}</p>}
    </div>
  )
}
