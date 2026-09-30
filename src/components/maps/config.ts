// ============================================================
// SmartFood AI — map provider configuration (client-side)
// Providers: "osm" (default, no key) | "mapbox" | "google"
// Public env vars (safe for the browser):
//   NEXT_PUBLIC_MAP_PROVIDER, NEXT_PUBLIC_MAP_API_KEY, NEXT_PUBLIC_MAP_STYLE
// Server-only secrets must NEVER use the NEXT_PUBLIC_ prefix.
// ============================================================
"use client"

export type MapProviderId = "osm" | "mapbox" | "google"

export interface MapProviderConfig {
  provider: MapProviderId
  apiKey: string
  styleUrl: string
  /** True when a keyed provider is actually usable (key present). */
  keyed: boolean
  /** Human-readable note shown in the UI (e.g. fallback notices). */
  note?: string
}

export function getMapProviderConfig(): MapProviderConfig {
  const raw = (process.env.NEXT_PUBLIC_MAP_PROVIDER ?? process.env.MAP_PROVIDER ?? "").trim().toLowerCase()
  const apiKey = (process.env.NEXT_PUBLIC_MAP_API_KEY ?? "").trim()
  const styleUrl = (process.env.NEXT_PUBLIC_MAP_STYLE ?? "").trim()

  if (raw === "mapbox") {
    if (!apiKey) {
      return { provider: "osm", apiKey: "", styleUrl: "", keyed: false, note: "Map API key missing — falling back to OpenStreetMap." }
    }
    return { provider: "mapbox", apiKey, styleUrl: styleUrl || "mapbox://styles/mapbox/streets-v12", keyed: true }
  }
  if (raw === "google") {
    if (!apiKey) {
      return { provider: "osm", apiKey: "", styleUrl: "", keyed: false, note: "Map API key missing — falling back to OpenStreetMap." }
    }
    return { provider: "google", apiKey, styleUrl: "", keyed: true }
  }
  return { provider: "osm", apiKey: "", styleUrl: "", keyed: false }
}

export function providerLabel(p: MapProviderConfig): string {
  if (p.provider === "mapbox") return "MAPBOX"
  if (p.provider === "google") return "GOOGLE MAPS"
  return "OPENSTREETMAP"
}
