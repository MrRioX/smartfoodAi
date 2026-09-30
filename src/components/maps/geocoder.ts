// ============================================================
// SmartFood AI — geocoder abstraction for the map pickers
// Uses the configured provider when available, otherwise the free
// Nominatim (OpenStreetMap) service. All calls are client-side and
// best-effort: failures degrade to manual pan/tap selection.
// ============================================================
"use client"

import type { MapProviderConfig } from "./config"

export interface GeoPlace {
  label: string
  lat: number
  lng: number
  address: string
  city: string
  state: string
  country: string
}

const IN_VIEWBOX = "68.1,6.7,97.4,35.9" // India bounding box (lng,lat pairs)

function parseNominatimItem(item: Record<string, unknown>): GeoPlace {
  const a = (item.address ?? {}) as Record<string, string>
  return {
    label: String(item.display_name ?? "Unnamed place"),
    lat: Number(item.lat),
    lng: Number(item.lon),
    address: [a.house_number, a.road, a.suburb, a.neighbourhood].filter(Boolean).join(", ") || String(item.display_name ?? "").split(",").slice(0, 2).join(",").trim(),
    city: a.city || a.town || a.village || a.district || a.county || "",
    state: a.state ?? "",
    country: a.country ?? "",
  }
}

/** Forward geocode (search). Returns [] on failure — callers stay silent. */
export async function geocodeSearch(q: string, cfg: MapProviderConfig): Promise<GeoPlace[]> {
  const query = q.trim()
  if (query.length < 3) return []
  try {
    if (cfg.provider === "mapbox" && cfg.apiKey) {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?country=in&limit=5&access_token=${cfg.apiKey}`,
        { signal: AbortSignal.timeout(6000) },
      )
      if (!res.ok) return []
      const data = await res.json()
      return (data?.features ?? []).map((f: Record<string, any>) => ({
        label: f.place_name ?? f.text ?? "Place",
        lat: f.center?.[1] ?? 0,
        lng: f.center?.[0] ?? 0,
        address: (f.place_name ?? "").split(",").slice(0, 2).join(",").trim(),
        city: f.text ?? "",
        state: (f.context ?? []).find((c: any) => String(c.id).startsWith("region"))?.text ?? "",
        country: (f.context ?? []).find((c: any) => String(c.id).startsWith("country"))?.text ?? "",
      }))
    }
    // Nominatim (OSM fallback + default)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=in&viewbox=${IN_VIEWBOX}&bounded=0&q=${encodeURIComponent(query)}`,
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(7000) },
    )
    if (!res.ok) return []
    const data = (await res.json()) as Array<Record<string, unknown>>
    return data.map(parseNominatimItem)
  } catch {
    return []
  }
}

/** Reverse geocode coordinates → place. Null on failure. */
export async function reverseGeocode(lat: number, lng: number, cfg: MapProviderConfig): Promise<GeoPlace | null> {
  try {
    if (cfg.provider === "mapbox" && cfg.apiKey) {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?limit=1&access_token=${cfg.apiKey}`,
        { signal: AbortSignal.timeout(6000) },
      )
      if (!res.ok) return null
      const data = await res.json()
      const f = data?.features?.[0]
      if (!f) return null
      return {
        label: f.place_name ?? "Selected point",
        lat,
        lng,
        address: (f.place_name ?? "").split(",").slice(0, 2).join(",").trim(),
        city: f.text ?? "",
        state: (f.context ?? []).find((c: any) => String(c.id).startsWith("region"))?.text ?? "",
        country: (f.context ?? []).find((c: any) => String(c.id).startsWith("country"))?.text ?? "",
      }
    }
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(7000) },
    )
    if (!res.ok) return null
    const data = (await res.json()) as Record<string, unknown>
    if (!data || data.error) return null
    return parseNominatimItem({ ...data, lat: String(lat), lon: String(lng) })
  } catch {
    return null
  }
}
