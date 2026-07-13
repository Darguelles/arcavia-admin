import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MAP_TILE_URL } from '../config'
import { t } from '../lib/i18n'

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

/**
 * Map picker for city bounding box + center pin (spec §6.1).
 * Operator draws rectangle and drops a center pin — no numeric entry.
 */
export function MapAreaPicker({ value, onChange, height = '400px' }: MapAreaPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const rectRef = useRef<L.Rectangle | null>(null)
  const centerRef = useRef<L.Marker | null>(null)
  const currentBbox = useRef<Partial<BoundingBox>>(value)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const defaultCenter: L.LatLngExpression =
      value.center_lat && value.center_lng
        ? [value.center_lat, value.center_lng]
        : [-12.0464, -77.0428]

    const map = L.map(containerRef.current).setView(defaultCenter, 11)
    mapRef.current = map

    L.tileLayer(MAP_TILE_URL, { attribution: '© MapTiler © OpenStreetMap' }).addTo(map)

    // Draw existing bounding box
    if (
      value.bbox_north !== undefined &&
      value.bbox_south !== undefined &&
      value.bbox_east !== undefined &&
      value.bbox_west !== undefined
    ) {
      drawRect(value.bbox_north, value.bbox_south, value.bbox_east, value.bbox_west)
    }

    if (value.center_lat !== undefined && value.center_lng !== undefined) {
      placeCenter(value.center_lat, value.center_lng)
    }

    // Click starts drawing a bounding box by dropping corners
    let firstCorner: L.LatLng | null = null

    map.on('click', (e: L.LeafletMouseEvent) => {
      if (!firstCorner) {
        firstCorner = e.latlng
        return
      }
      const north = Math.max(firstCorner.lat, e.latlng.lat)
      const south = Math.min(firstCorner.lat, e.latlng.lat)
      const east = Math.max(firstCorner.lng, e.latlng.lng)
      const west = Math.min(firstCorner.lng, e.latlng.lng)
      drawRect(north, south, east, west)
      firstCorner = null
    })

    map.on('contextmenu', (e: L.LeafletMouseEvent) => {
      placeCenter(e.latlng.lat, e.latlng.lng)
    })

    function drawRect(north: number, south: number, east: number, west: number) {
      if (rectRef.current) rectRef.current.remove()
      rectRef.current = L.rectangle(
        [
          [south, west],
          [north, east],
        ],
        {
          color: '#6366f1',
          weight: 2,
          fillOpacity: 0.1,
        }
      ).addTo(map)
      currentBbox.current = {
        ...currentBbox.current,
        bbox_north: north,
        bbox_south: south,
        bbox_east: east,
        bbox_west: west,
      }
      emitChange()
    }

    function placeCenter(cLat: number, cLng: number) {
      if (centerRef.current) {
        centerRef.current.setLatLng([cLat, cLng])
      } else {
        centerRef.current = L.marker([cLat, cLng], {
          draggable: true,
          title: 'Centro de la ciudad',
        }).addTo(map)
        centerRef.current.on('dragend', () => {
          const pos = centerRef.current!.getLatLng()
          currentBbox.current = { ...currentBbox.current, center_lat: pos.lat, center_lng: pos.lng }
          emitChange()
        })
      }
      currentBbox.current = { ...currentBbox.current, center_lat: cLat, center_lng: cLng }
      emitChange()
    }

    function emitChange() {
      const b = currentBbox.current
      if (
        b.bbox_north !== undefined &&
        b.bbox_south !== undefined &&
        b.bbox_east !== undefined &&
        b.bbox_west !== undefined &&
        b.center_lat !== undefined &&
        b.center_lng !== undefined
      ) {
        onChange(b as BoundingBox)
      }
    }

    return () => {
      map.remove()
      mapRef.current = null
      rectRef.current = null
      centerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={containerRef}
        style={{ height }}
        className="rounded-lg border border-gray-300 overflow-hidden min-w-[300px]"
        aria-label="Mapa para definir el área de la ciudad"
      />
      <p className="text-xs text-gray-500">
        <strong>Click izquierdo dos veces</strong> para dibujar el área.{' '}
        <strong>Click derecho</strong> para fijar el centro. {t.cityMapAreaHint}
      </p>
    </div>
  )
}
