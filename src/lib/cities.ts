// ============================================================
// SmartFood AI — shared Indian demo city list + reference coords
// Used by registration, donation forms, planner pricing and the
// map pickers so every screen offers the same locations.
// Coordinates are real city-centre values (demo reference points).
// ============================================================

export interface DemoCity {
  name: string
  state: string
  lat: number
  lng: number
}

export const DEMO_CITIES: DemoCity[] = [
  { name: "Ahmedabad", state: "Gujarat", lat: 23.0225, lng: 72.5714 },
  { name: "Surat", state: "Gujarat", lat: 21.1702, lng: 72.8311 },
  { name: "Vadodara", state: "Gujarat", lat: 22.3072, lng: 73.1812 },
  { name: "Rajkot", state: "Gujarat", lat: 22.3039, lng: 70.8022 },
  { name: "Mumbai", state: "Maharashtra", lat: 19.076, lng: 72.8777 },
  { name: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567 },
  { name: "Delhi", state: "Delhi", lat: 28.6139, lng: 77.209 },
  { name: "Jaipur", state: "Rajasthan", lat: 26.9124, lng: 75.7873 },
  { name: "Bengaluru", state: "Karnataka", lat: 12.9716, lng: 77.5946 },
]

export const CITY_NAMES = DEMO_CITIES.map((c) => c.name)

export function cityCenter(name: string): { lat: number; lng: number; state: string } {
  const c = DEMO_CITIES.find((x) => x.name.toLowerCase() === name.trim().toLowerCase())
  return c
    ? { lat: c.lat, lng: c.lng, state: c.state }
    : { lat: DEMO_CITIES[0].lat, lng: DEMO_CITIES[0].lng, state: DEMO_CITIES[0].state }
}
