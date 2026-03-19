import { useEffect, useRef } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"

export interface MapMarkerConfig {
  id: string
  lat: number
  lng: number
  color: string
  iconHtml?: string
  title?: string
  pulse?: boolean
  onClick?: () => void
}

interface MapLibreMapProps {
  className?: string
  center: [number, number]
  zoom?: number
  markers?: MapMarkerConfig[]
}

const DEFAULT_STYLE = "https://tiles.stadiamaps.com/styles/osm_bright.json"

export function MapLibreMap({ className, center, zoom = 12, markers = [] }: MapLibreMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRefs = useRef<Map<string, maplibregl.Marker>>(new Map())

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DEFAULT_STYLE,
      center,
      zoom,
      attributionControl: false,
    })

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right")
    mapRef.current = map

    return () => {
      markerRefs.current.forEach((marker) => marker.remove())
      markerRefs.current.clear()
      map.remove()
      mapRef.current = null
    }
  }, [center, zoom])

  useEffect(() => {
    if (!mapRef.current) return

    markerRefs.current.forEach((marker) => marker.remove())
    markerRefs.current.clear()

    markers.forEach((markerConfig) => {
      const el = document.createElement("button")
      el.type = "button"
      el.className = "mapbox-marker-btn"
      el.style.width = "30px"
      el.style.height = "30px"
      el.style.borderRadius = "9999px"
      el.style.border = "2px solid rgba(255,255,255,0.45)"
      el.style.background = markerConfig.color
      el.style.color = "#ffffff"
      el.style.display = "flex"
      el.style.alignItems = "center"
      el.style.justifyContent = "center"
      el.style.cursor = "pointer"
      el.style.boxShadow = "0 8px 20px rgba(0,0,0,0.35)"
      el.style.transition = "transform 160ms ease"
      if (markerConfig.pulse) {
        el.style.animation = "mapboxMarkerPulse 1.6s infinite"
      }
      if (markerConfig.iconHtml) {
        el.innerHTML = markerConfig.iconHtml
      }
      if (markerConfig.title) {
        el.title = markerConfig.title
      }
      el.onmouseenter = () => { el.style.transform = "scale(1.08)" }
      el.onmouseleave = () => { el.style.transform = "scale(1)" }
      el.onclick = (event) => {
        event.stopPropagation()
        markerConfig.onClick?.()
      }

      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([markerConfig.lng, markerConfig.lat])
        .addTo(mapRef.current!)

      markerRefs.current.set(markerConfig.id, marker)
    })
  }, [markers])

  useEffect(() => {
    if (!mapRef.current) return
    mapRef.current.easeTo({ center, zoom, duration: 700 })
  }, [center, zoom])

  return (
    <div className={className ?? "relative h-full w-full"}>
      <style>
        {`@keyframes mapboxMarkerPulse { 0% { transform: scale(1); } 50% { transform: scale(1.13); } 100% { transform: scale(1); } }`}
      </style>
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  )
}

export const MapboxMap = MapLibreMap
