// ============================================================
// SmartFood AI — Leaflet + OpenStreetMap adapter (default / fallback)
// Implements the shared map canvas contract: markers with popups,
// click-to-pick, draggable pick marker, fit-bounds. Touch friendly.
// ============================================================
"use client"

import { useEffect, useRef, useState } from "react"
import type * as LType from "leaflet"
import { MAP_CATEGORIES, popupHtml, type MapMarker } from "../MapMarker"

export interface BaseMapCanvasProps {
  center?: { lat: number; lng: number }
  zoom?: number
  markers?: MapMarker[]
  onMarkerClick?: (id: string) => void
  onMapClick?: (lat: number, lng: number) => void
  pickMarker?: { lat: number; lng: number } | null
  onPickMarkerMove?: (lat: number, lng: number) => void
  fitAll?: boolean
  className?: string
  ariaLabel?: string
}

export const DEFAULT_MAP_CENTER = { lat: 23.0225, lng: 72.5714 }

export function LeafletCanvas({
  center = DEFAULT_MAP_CENTER,
  zoom = 12,
  markers = [],
  onMarkerClick,
  onMapClick,
  pickMarker = null,
  onPickMarkerMove,
  fitAll = false,
  className,
  ariaLabel = "SmartFood AI map",
}: BaseMapCanvasProps) {
  const divRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LType.Map | null>(null)
  const layerRef = useRef<LType.LayerGroup | null>(null)
  const pickRef = useRef<LType.Marker | null>(null)
  const leafletRef = useRef<typeof LType | null>(null)
  const clickRef = useRef(onMarkerClick)
  const mapClickRef = useRef(onMapClick)
  const pickMoveRef = useRef(onPickMarkerMove)
  clickRef.current = onMarkerClick
  mapClickRef.current = onMapClick
  pickMoveRef.current = onPickMarkerMove
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const L = (await import("leaflet")).default
      if (cancelled || !divRef.current || mapRef.current) return
      leafletRef.current = L
      const map = L.map(divRef.current, { zoomControl: true, attributionControl: true }).setView([center.lat, center.lng], zoom)
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map)
      layerRef.current = L.layerGroup().addTo(map)
      mapRef.current = map
      map.on("popupopen", (e: LType.PopupEvent) => {
        const btn = (e.popup.getElement() as HTMLElement | null)?.querySelector("button[data-sf-marker]")
        btn?.addEventListener("click", (ev) => {
          const id = (ev.currentTarget as HTMLElement).dataset.sfMarker
          if (id) clickRef.current?.(id)
        })
      })
      map.on("click", (e: LType.LeafletMouseEvent) => {
        mapClickRef.current?.(e.latlng.lat, e.latlng.lng)
      })
      setReady(true)
      setTimeout(() => map.invalidateSize(), 100)
    })()
    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      layerRef.current = null
      pickRef.current = null
    }
     
  }, [])

  // markers layer
  useEffect(() => {
    const L = leafletRef.current
    const map = mapRef.current
    const layer = layerRef.current
    if (!L || !map || !layer || !ready) return
    layer.clearLayers()
    for (const m of markers) {
      const cat = MAP_CATEGORIES[m.category]
      const icon = L.divIcon({
        className: "",
        html: `<div class="sf-marker-pin" style="background:${cat.color}"><span class="sf-marker-icon">${cat.emoji}</span></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 28],
        popupAnchor: [0, -26],
      })
      L.marker([m.lat, m.lng], { icon }).addTo(layer).bindPopup(popupHtml(m), { closeButton: true })
    }
    if (fitAll && markers.length > 1) {
      map.fitBounds(L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number])).pad(0.15))
    }
  }, [markers, ready, fitAll])

  // pick marker
  useEffect(() => {
    const L = leafletRef.current
    const map = mapRef.current
    if (!L || !map || !ready) return
    if (!pickMarker) {
      pickRef.current?.remove()
      pickRef.current = null
      return
    }
    if (!pickRef.current) {
      const icon = L.divIcon({
        className: "",
        html: `<div class="sf-marker-pin" style="background:#2563eb"><span class="sf-marker-icon">📍</span></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 28],
      })
      const marker = L.marker([pickMarker.lat, pickMarker.lng], { icon, draggable: true, zIndexOffset: 900 }).addTo(map)
      marker.on("dragend", () => {
        const p = marker.getLatLng()
        pickMoveRef.current?.(p.lat, p.lng)
      })
      pickRef.current = marker
    } else {
      pickRef.current.setLatLng([pickMarker.lat, pickMarker.lng])
    }
  }, [pickMarker, ready])

  return <div ref={divRef} className={className ?? "h-[320px] w-full rounded-xl border sm:h-[380px]"} role="application" aria-label={ariaLabel} />
}
