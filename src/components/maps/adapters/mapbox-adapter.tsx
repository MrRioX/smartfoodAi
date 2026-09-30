// ============================================================
// SmartFood AI — Mapbox GL JS adapter
// Activated when NEXT_PUBLIC_MAP_PROVIDER=mapbox and a public token
// is configured. Dynamically imported so OSM users never download
// the Mapbox bundle. Falls back with a thrown error if the token /
// SDK fails, which MapView converts to the OSM fallback.
// ============================================================
"use client"

import { useEffect, useRef } from "react"
import type { Map as MlMap, Marker as MlMarker, Popup as MlPopup } from "mapbox-gl"
import { MAP_CATEGORIES, type MapMarker } from "../MapMarker"
import type { BaseMapCanvasProps } from "./leaflet-adapter"

function markerHtml(m: MapMarker): string {
  const cat = MAP_CATEGORIES[m.category]
  return `<div style="min-width:170px;font-family:inherit">
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
      <span style="width:10px;height:10px;border-radius:99px;background:${cat.color};display:inline-block"></span>
      <span style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase">${cat.label}</span>
    </div>
    <div style="font-weight:700;font-size:14px">${m.title.replace(/</g, "&lt;")}</div>
    ${m.subtitle ? `<div style="font-size:12px;color:#475569">${m.subtitle.replace(/</g, "&lt;")}</div>` : ""}
    ${m.detail ? `<div style="font-size:12px;color:#64748b">${m.detail.replace(/</g, "&lt;")}</div>` : ""}
  </div>`
}

export function MapboxCanvas(props: BaseMapCanvasProps) {
  const { center = { lat: 23.0225, lng: 72.5714 }, zoom = 12, markers = [], onMarkerClick, onMapClick, pickMarker, onPickMarkerMove, fitAll, className, ariaLabel = "SmartFood AI map" } = props
  const divRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MlMap | null>(null)
  const cfg = useRef(process.env.NEXT_PUBLIC_MAP_API_KEY ?? "")
  const styleRef = useRef(process.env.NEXT_PUBLIC_MAP_STYLE || "mapbox://styles/mapbox/streets-v12")
  const markerObjs = useRef<MlMarker[]>([])
  const pickObj = useRef<MlMarker | null>(null)
  const popups = useRef<MlPopup[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const mapboxgl = (await import("mapbox-gl")).default
      if (cancelled || !divRef.current || mapRef.current) return
      mapboxgl.accessToken = cfg.current
      const map = new mapboxgl.Map({
        container: divRef.current,
        style: styleRef.current,
        center: [center.lng, center.lat],
        zoom: zoom - 1,
        attributionControl: false,
      })
      map.addControl(new mapboxgl.NavigationControl(), "top-right")
      map.on("click", (e) => onMapClick?.(e.lngLat.lat, e.lngLat.lng))
      mapRef.current = map
      setTimeout(() => map.resize(), 100)
    })()
    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      markerObjs.current = []
      pickObj.current = null
      popups.current = []
    }
     
  }, [])

  // markers
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const mapboxgl = (await import("mapbox-gl")).default
      const map = mapRef.current
      if (cancelled || !map) return
      markerObjs.current.forEach((mk) => mk.remove())
      markerObjs.current = []
      popups.current.forEach((p) => p.remove())
      popups.current = []
      for (const m of markers) {
        const cat = MAP_CATEGORIES[m.category]
        const el = document.createElement("div")
        el.className = "sf-marker-pin"
        el.style.background = cat.color
        el.innerHTML = `<span class="sf-marker-icon">${cat.emoji}</span>`
        const mk = new mapboxgl.Marker(el).setLngLat([m.lng, m.lat]).addTo(map)
        if (m.ctaLabel && onMarkerClick) {
          el.addEventListener("click", () => onMarkerClick(m.id))
        }
        const popup = new mapboxgl.Popup({ offset: 26, closeButton: true }).setHTML(markerHtml(m))
        mk.setPopup(popup)
        markerObjs.current.push(mk)
        popups.current.push(popup)
      }
      if (fitAll && markers.length > 1) {
        const lons = markers.map((m) => m.lng)
        const lats = markers.map((m) => m.lat)
        map.fitBounds(
          [
            [Math.min(...lons), Math.min(...lats)],
            [Math.max(...lons), Math.max(...lats)],
          ],
          { padding: 60, maxZoom: 15 },
        )
      }
    })()
    return () => {
      cancelled = true
    }
  }, [markers, fitAll, onMarkerClick])

  // pick marker
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const mapboxgl = (await import("mapbox-gl")).default
      const map = mapRef.current
      if (cancelled || !map) return
      if (!pickMarker) {
        pickObj.current?.remove()
        pickObj.current = null
        return
      }
      if (!pickObj.current) {
        const el = document.createElement("div")
        el.className = "sf-marker-pin"
        el.style.background = "#2563eb"
        el.innerHTML = `<span class="sf-marker-icon">📍</span>`
        const mk = new mapboxgl.Marker(el, { draggable: true }).setLngLat([pickMarker.lng, pickMarker.lat]).addTo(map)
        mk.on("dragend", () => {
          const p = mk.getLngLat()
          onPickMarkerMove?.(p.lat, p.lng)
        })
        pickObj.current = mk
      } else {
        pickObj.current.setLngLat([pickMarker.lng, pickMarker.lat])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [pickMarker, onPickMarkerMove])

  return <div ref={divRef} className={className ?? "h-[320px] w-full rounded-xl border sm:h-[380px]"} role="application" aria-label={ariaLabel} />
}
