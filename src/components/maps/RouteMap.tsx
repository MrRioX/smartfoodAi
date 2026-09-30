// ============================================================
// SmartFood AI — RouteMap (delivery navigation with Gemini Route Advisor)
// Tries real road routing when available:
//   OSRM public demo service (default) · Mapbox Directions (mapbox provider)
// Powered by Gemini AI for Route Finding & Distribution Optimization.
// ============================================================
"use client"

import { useEffect, useRef, useState } from "react"
import type * as LType from "leaflet"
import { useMapProvider } from "./MapProvider"
import { escapeHtml } from "./MapMarker"
import { Sparkles, Navigation, ShieldAlert, Clock, MapPin } from "lucide-react"

interface RouteAdvisorData {
  recommendedRoute?: string
  estimatedDurationMin?: number
  optimalSpeedKmph?: number
  foodHoldingTimeMaxHours?: number
  safetyAdvisory?: string
  checkpoints?: string[]
  engine?: { source: string; model?: string }
}

export function RouteMap({
  pickup,
  dest,
  foodDescription,
  quantity,
  unit,
  vehicleType,
  className,
}: {
  pickup: { lat: number; lng: number; name: string; area?: string }
  dest: { lat: number; lng: number; name: string; area?: string }
  foodDescription?: string
  quantity?: number
  unit?: string
  vehicleType?: string
  className?: string
}) {
  const cfg = useMapProvider()
  const divRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LType.Map | null>(null)
  const [routeNote, setRouteNote] = useState("Loading route…")
  const [advisor, setAdvisor] = useState<RouteAdvisorData | null>(null)
  const [loadingAdvisor, setLoadingAdvisor] = useState(false)

  // Fetch Gemini AI Route Advisor
  useEffect(() => {
    let cancelled = false
    async function fetchGeminiRoute() {
      setLoadingAdvisor(true)
      try {
        const res = await fetch("/api/ai/route-advisor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pickup,
            destination: dest,
            foodDescription,
            quantity,
            unit,
            vehicleType,
          }),
        })
        if (!cancelled && res.ok) {
          const data = await res.json()
          setAdvisor(data)
        }
      } catch {
        /* fallback handled gracefully */
      } finally {
        if (!cancelled) setLoadingAdvisor(false)
      }
    }
    fetchGeminiRoute()
    return () => {
      cancelled = true
    }
  }, [pickup.lat, pickup.lng, dest.lat, dest.lng, foodDescription, quantity, unit, vehicleType])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const L = (await import("leaflet")).default
      if (cancelled || !divRef.current) return
      const map = L.map(divRef.current).setView([(pickup.lat + dest.lat) / 2, (pickup.lng + dest.lng) / 2], 12)
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map)

      const mk = (color: string, emoji: string) =>
        L.divIcon({
          className: "",
          html: `<div class="sf-marker-pin" style="background:${color}"><span class="sf-marker-icon">${emoji}</span></div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 28],
          popupAnchor: [0, -26],
        })
      L.marker([pickup.lat, pickup.lng], { icon: mk("#059669", "📦") }).addTo(map).bindPopup(`<b>Pickup:</b> ${escapeHtml(pickup.name)}`)
      L.marker([dest.lat, dest.lng], { icon: mk("#e11d48", "📍") }).addTo(map).bindPopup(`<b>Destination:</b> ${escapeHtml(dest.name)}`)

      let drewRoad = false
      // 1) Mapbox Directions when the mapbox provider is configured
      if (cfg.provider === "mapbox" && cfg.apiKey) {
        try {
          const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${pickup.lng},${pickup.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson&access_token=${cfg.apiKey}`
          const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
          if (res.ok) {
            const data = await res.json()
            const coords: Array<[number, number]> | undefined = data?.routes?.[0]?.geometry?.coordinates?.map(
              (c: [number, number]) => [c[1], c[0]] as [number, number],
            )
            if (coords?.length) {
              L.polyline(coords, { color: "#059669", weight: 5, opacity: 0.85 }).addTo(map)
              map.fitBounds(L.latLngBounds(coords).pad(0.15))
              setRouteNote("Road route via Mapbox Directions")
              drewRoad = true
            }
          }
        } catch {
          /* fall through to OSRM */
        }
      }
      // 2) OSRM public routing demo
      if (!drewRoad) {
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`
          const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
          if (res.ok) {
            const data = await res.json()
            const coords: Array<[number, number]> | undefined = data?.routes?.[0]?.geometry?.coordinates?.map(
              (c: [number, number]) => [c[1], c[0]] as [number, number],
            )
            if (coords?.length) {
              L.polyline(coords, { color: "#059669", weight: 5, opacity: 0.85 }).addTo(map)
              map.fitBounds(L.latLngBounds(coords).pad(0.15))
              setRouteNote("Road route via OSRM")
              drewRoad = true
            }
          }
        } catch {
          /* fall through to straight line */
        }
      }
      if (!cancelled && !drewRoad) {
        L.polyline(
          [
            [pickup.lat, pickup.lng],
            [dest.lat, dest.lng],
          ],
          { color: "#059669", weight: 4, dashArray: "8 10", opacity: 0.9 },
        ).addTo(map)
        map.fitBounds(
          L.latLngBounds([
            [pickup.lat, pickup.lng],
            [dest.lat, dest.lng],
          ]).pad(0.2),
        )
        setRouteNote("Direct line connecting pickup & drop")
      }
      mapRef.current = map
      setTimeout(() => map.invalidateSize(), 100)
    })()
    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [pickup.lat, pickup.lng, dest.lat, dest.lng, cfg])

  return (
    <div className="space-y-3">
      <div ref={divRef} className={className ?? "h-[300px] w-full rounded-xl border sm:h-[360px]"} role="application" aria-label="Delivery route map" />
      <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
        <span>{routeNote}</span>
        {advisor?.engine?.source === "ai" && (
          <span className="flex items-center gap-1 font-semibold text-emerald-600">
            <Sparkles className="h-3 w-3" /> Gemini Route AI Active
          </span>
        )}
      </div>

      {/* Gemini Route Finding & Distribution Optimization Card */}
      {advisor && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 text-xs text-foreground space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800">
              <Navigation className="h-4 w-4 text-emerald-600" />
              <span>Gemini Route & Distribution Advisory</span>
            </div>
            {advisor.estimatedDurationMin && (
              <span className="flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                <Clock className="h-3 w-3" /> ~{advisor.estimatedDurationMin} mins
              </span>
            )}
          </div>

          <p className="font-medium text-slate-800">
            <span className="text-muted-foreground">Optimal Path: </span>
            {advisor.recommendedRoute}
          </p>

          {advisor.checkpoints && advisor.checkpoints.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] font-semibold text-muted-foreground">Checkpoints:</span>
              {advisor.checkpoints.map((cp, idx) => (
                <span key={idx} className="flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[10px] font-medium border text-slate-700 shadow-2xs">
                  <MapPin className="h-2.5 w-2.5 text-emerald-600" />
                  {cp}
                </span>
              ))}
            </div>
          )}

          {advisor.safetyAdvisory && (
            <div className="flex items-start gap-1.5 rounded-lg bg-amber-50 p-2 text-amber-900 border border-amber-200 text-[11px]">
              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-bold">Distribution Safety: </span>
                {advisor.safetyAdvisory}
                {advisor.foodHoldingTimeMaxHours && (
                  <span className="ml-1 text-[10px] font-semibold text-amber-800">
                    (Max safe holding window: {advisor.foodHoldingTimeMaxHours}h)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
