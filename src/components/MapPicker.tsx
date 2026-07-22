import { useEffect, useRef } from 'react'
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

interface MapPickerProps {
  lat: number | undefined
  lng: number | undefined
  toleranceRadius: number
  onChange: (lat: number, lng: number) => void
  readOnly?: boolean
  height?: string
}

/**
 * Single-pin map picker for mission QR location.
 * Operator drags pin to set lat/lng — no numeric entry (spec §6.4).
 * Draws a tolerance circle to visualise the catch area.
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

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const defaultCenter: L.LatLngExpression = lat && lng ? [lat, lng] : [-12.0464, -77.0428]
    const map = L.map(containerRef.current).setView(defaultCenter, lat && lng ? 16 : 12)
    mapRef.current = map

    L.tileLayer(resolveTileUrl(MAP_TILE_URL), { attribution: '© OpenStreetMap' }).addTo(map)

    // The container is sized by the surrounding flex/grid layout after mount;
    // recompute so Leaflet doesn't latch onto a 0/stale size and render blank.
    const invalidateTimer = setTimeout(() => map.invalidateSize(), 0)

    if (!readOnly) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat: newLat, lng: newLng } = e.latlng
        placeMarker(newLat, newLng)
        onChange(newLat, newLng)
      })
    }

    if (lat !== undefined && lng !== undefined) {
      placeMarker(lat, lng)
    }

    function placeMarker(newLat: number, newLng: number) {
      if (markerRef.current) {
        markerRef.current.setLatLng([newLat, newLng])
      } else {
        const marker = L.marker([newLat, newLng], { draggable: !readOnly })
        marker.addTo(map)
        if (!readOnly) {
          marker.on('dragend', () => {
            const pos = marker.getLatLng()
            updateCircle(pos.lat, pos.lng)
            onChange(pos.lat, pos.lng)
          })
        }
        markerRef.current = marker
      }
      updateCircle(newLat, newLng)
    }

    function updateCircle(cLat: number, cLng: number) {
      if (circleRef.current) {
        circleRef.current.setLatLng([cLat, cLng])
        circleRef.current.setRadius(toleranceRadius)
      } else {
        circleRef.current = L.circle([cLat, cLng], {
          radius: toleranceRadius,
          color: '#6366f1',
          fillColor: '#6366f1',
          fillOpacity: 0.15,
        }).addTo(map)
      }
    }

    return () => {
      clearTimeout(invalidateTimer)
      map.remove()
      mapRef.current = null
      markerRef.current = null
      circleRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        className="rounded-lg border border-gray-300 overflow-hidden min-w-[300px]"
        aria-label="Mapa para colocar el pin de ubicación"
      />
      {!readOnly && <p className="text-xs text-gray-500">{t.mapPinHint}</p>}
    </div>
  )
}
