// ============================================================
// SmartFood AI — ingredient price data layer (DEMO DATA)
// The AI never invents prices — it reads this table. When a real
// price source is connected later, replace getCityPrices() with an
// API/DB call and flip `demo` to false.
// Structure per record: city · ingredient · price · unit ·
// date_updated · source · demo=true
// ============================================================
import type { IngredientPrice } from "./types"
import { DEMO_CITIES } from "./cities"

type PriceSeed = [ingredient: string, unit: string, basePrice: number, cityFactor: number]

// Base demo ₹ prices (per stated unit) with a per-city multiplier.
const BASE_PRICES: PriceSeed[] = [
  ["Rice", "kg", 52, 1.0],
  ["Dal", "kg", 140, 1.0],
  ["Atta (Wheat Flour)", "kg", 42, 1.0],
  ["Oil", "L", 118, 1.05],
  ["Vegetables", "kg", 46, 1.1],
  ["Spices", "kg", 320, 1.0],
  ["Suji (Semolina)", "kg", 44, 1.0],
  ["Poha (Flattened Rice)", "kg", 48, 1.0],
  ["Milk", "L", 30, 1.0],
  ["Ghee", "L", 560, 1.05],
  ["Sugar", "kg", 46, 1.0],
  ["Salt", "kg", 24, 1.0],
]

// Small deterministic city multipliers so the selected location
// visibly affects prices (demo variation, not market data).
const CITY_FACTORS: Record<string, number> = {
  Ahmedabad: 1.0,
  Surat: 0.97,
  Vadodara: 0.96,
  Rajkot: 0.94,
  Mumbai: 1.14,
  Pune: 1.08,
  Delhi: 1.12,
  Jaipur: 0.95,
  Bengaluru: 1.1,
}

function factorFor(city: string): number {
  return CITY_FACTORS[city] ?? 1.0
}

/** Deterministic demo prices for one city. */
export function getCityPrices(city: string): IngredientPrice[] {
  const f = factorFor(city) * cityFactorJitter(city)
  const updated = new Date(Date.now() - 3 * 24 * 3600_000).toISOString().slice(0, 10)
  return BASE_PRICES.map(([ingredient, unit, base]) => ({
    city,
    ingredient,
    price: Math.round(base * f),
    unit,
    dateUpdated: updated,
    source: "Demo price dataset (local market estimate)",
    demo: true,
  }))
}

/** Deterministic ±2% jitter from the city name so all cities differ. */
function cityFactorJitter(city: string): number {
  let h = 0
  for (let i = 0; i < city.length; i++) h = (h * 31 + city.charCodeAt(i)) % 1000
  return 0.98 + (h / 1000) * 0.04
}

/** Lookup one ingredient price for a city (fallback: city-neutral average). */
export function getPrice(city: string, ingredient: string): IngredientPrice | null {
  const list = getCityPrices(city)
  return list.find((p) => p.ingredient.toLowerCase() === ingredient.trim().toLowerCase()) ?? null
}

export const PRICE_CITIES = DEMO_CITIES.map((c) => c.name)
