// ============================================================
// SmartFood AI — Google Maps adapter
// Activated when NEXT_PUBLIC_MAP_PROVIDER=google and a client key
// is configured. The Maps JS API is loaded once via script tag
// (no extra npm package). Best-effort: errors bubble to MapView
// which falls back to OSM.
// ============================================================
"use client"

import { useEffect, useRef } from "react"
import { MAP_CATEGORIES, type MapMarker } from "../MapMarker"
import type { BaseMapCanvasProps } from "./leaflet-adapter"

type GMap = any
type GMarker = any

declare global {
  interface Window {
    google?: any
    __sfGoogleMapsLoading?: Promise<void>
  }
}

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"))
  if (window.google?.maps) return Promise.resolve()
  if (window.__sfGoogleMapsLoading) return window.__sfGoogleMapsLoading
  const effectiveKey = apiKey || process.env.NEXT_PUBLIC_MAP_API_KEY || "AIzaSyAu1H2iQGiKFCCdl8CcI-wEnKg9M6IRtOE"
  window.__sfGoogleMapsLoading = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script")
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(effectiveKey)}&libraries=marker,places`
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error("Google Maps failed to load"))
    document.head.appendChild(s)
    setTimeout(() => reject(new Error("Google Maps load timeout")), 12_000)
  })
  return window.__sfGoogleMapsLoading
}

export function GoogleCanvas(props: BaseMapCanvasProps) {
  const { center = { lat: 23.0225, lng: 72.5714 }, zoom = 12, markers = [], onMarkerClick, onMapClick, pickMarker, onPickMarkerMove, fitAll, className, ariaLabel = "SmartFood AI map" } = props
  const divRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<GMap | null>(null)
  const gRef = useRef<any>(null)
  const markersRef = useRef<GMarker[]>([])
  const pickRef = useRef<GMarker | null>(null)
  const clickListenerRef = useRef<any>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await loadGoogleMaps(process.env.NEXT_PUBLIC_MAP_API_KEY ?? "")
      if (cancelled || !divRef.current || mapRef.current) return
      const g = window.google
      gRef.current = g
      const map = new g.maps.Map(divRef.current, {
        center: { lat: center.lat, lng: center.lng },
        zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      })
      map.addListener("click", (e: any) => {
        if (e.latLng) onMapClick?.(e.latLng.lat(), e.latLng.lng())
      })
      mapRef.current = map
    })()
    return () => {
      cancelled = true
      if (clickListenerRef.current) window.google?.maps?.event?.removeListener?.(clickListenerRef.current)
      markersRef.current = []
      pickRef.current = null
      mapRef.current = null
    }
     
  }, [])

  // markers
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const g = gRef.current ?? (typeof window !== "undefined" ? window.google : null)
      const map = mapRef.current
      if (cancelled || !g || !map) return
      markersRef.current.forEach((mk) => mk.setMap(null))
      markersRef.current = []
      const bounds = new g.maps.LatLngBounds()
      for (const m of markers) {
        const cat = MAP_CATEGORIES[m.category]
        const mk = new g.maps.Marker({
          position: { lat: m.lat, lng: m.lng },
          map,
          title: m.title,
          label: { text: cat.emoji, fontSize: "14px" },
        })
        if (m.subtitle || m.detail || m.ctaLabel) {
          const html = `${m.subtitle ? `<div style="font-size:12px;color:#475569">${m.subtitle.replace(/</g, "&lt;")}</div>` : ""}${m.detail ? `<div style="font-size:12px;color:#64748b">${m.detail.replace(/</g, "&lt;")}</div>` : ""}${m.ctaLabel && onMarkerClick ? `<button data-gid="${m.id}" style="margin-top:6px;width:100%;background:#059669;color:#fff;border:0;border-radius:8px;padding:7px 10px;font-size:12px;font-weight:600;cursor:pointer">${m.ctaLabel.replace(/</g, "&lt;")}</button>` : ""}`
          const info = new g.maps.InfoWindow({ content: `<div style="font-weight:700;font-size:14px">${m.title.replace(/</g, "&lt;")}</div>${html}` })
          mk.addListener("click", () => {
            info.open({ anchor: mk, map })
            setTimeout(() => {
              const btn = (document.querySelector(`button[data-gid="${m.id}"]`) as HTMLButtonElement | null)
              btn?.addEventListener("click", () => onMarkerClick?.(m.id))
            }, 50)
          })
        }
        markersRef.current.push(mk)
        bounds.extend({ lat: m.lat, lng: m.lng })
      }
      if (fitAll && markers.length > 1) map.fitBounds(bounds, 60)
    })()
    return () => {
      cancelled = true
    }
  }, [markers, fitAll, onMarkerClick])

  // pick marker
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const g = gRef.current ?? (typeof window !== "undefined" ? window.google : null)
      const map = mapRef.current
      if (cancelled || !g || !map) return
      if (!pickMarker) {
        pickRef.current?.setMap(null)
        pickRef.current = null
        return
      }
      if (!pickRef.current) {
        const mk = new g.maps.Marker({
          position: { lat: pickMarker.lat, lng: pickMarker.lng },
          map,
          draggable: true,
          title: "Selected location",
        })
        mk.addListener("dragend", (e: any) => onPickMarkerMove?.(e.latLng.lat(), e.latLng.lng()))
        pickRef.current = mk
      } else {
        pickRef.current.setPosition({ lat: pickMarker.lat, lng: pickMarker.lng })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [pickMarker, onPickMarkerMove])

  return <div ref={divRef} className={className ?? "h-[320px] w-full rounded-xl border sm:h-[380px]"} role="application" aria-label={ariaLabel} />
}
