// ============================================================
// SmartFood AI — Deterministic demo calculation logic.
// These are DEMO estimates, NOT real AI/ML model outputs.
// Every consuming screen labels results as "DEMO AI RESULT".
// ============================================================
import type {
  DeliveryRequest, IngredientQty, MealPlanResult, StandalonePartner,
} from "./types"
import { DEMO_CITIES, CITY_NAMES, cityCenter } from "./cities"
export { DEMO_CITIES, CITY_NAMES, cityCenter }

// ---------- demo ingredient ratios per meal type (kg or L per meal) ----------
const INGREDIENT_TABLE: Record<string, Array<[string, number, string, number]>> = {
  "Dal Rice": [["Rice", 0.09, "kg", 52], ["Dal", 0.035, "kg", 140], ["Oil", 0.008, "L", 118], ["Vegetables", 0.05, "kg", 46], ["Spices", 0.004, "kg", 320]],
  "Khichdi": [["Rice", 0.07, "kg", 52], ["Dal", 0.045, "kg", 140], ["Oil", 0.007, "L", 118], ["Vegetables", 0.06, "kg", 46], ["Spices", 0.005, "kg", 320]],
  "Roti Sabzi": [["Atta (Wheat Flour)", 0.11, "kg", 42], ["Vegetables", 0.12, "kg", 46], ["Oil", 0.01, "L", 118], ["Spices", 0.004, "kg", 320]],
  "Vegetable Pulao": [["Rice", 0.095, "kg", 52], ["Vegetables", 0.09, "kg", 46], ["Oil", 0.01, "L", 118], ["Spices", 0.005, "kg", 320]],
  "Pulao": [["Rice", 0.095, "kg", 52], ["Vegetables", 0.09, "kg", 46], ["Oil", 0.01, "L", 118], ["Spices", 0.005, "kg", 320]],
  "Veg Biryani": [["Rice", 0.1, "kg", 52], ["Vegetables", 0.1, "kg", 46], ["Ghee", 0.008, "L", 480], ["Spices", 0.006, "kg", 320], ["Curd/Yogurt", 0.03, "kg", 70]],
  "Paneer Butter Masala": [["Paneer", 0.09, "kg", 340], ["Vegetables (Tomatoes & Onions)", 0.12, "kg", 46], ["Butter & Cream", 0.015, "kg", 480], ["Oil", 0.008, "L", 118], ["Spices", 0.005, "kg", 320]],
  "Pav Bhaji": [["Vegetables (Potatoes, Peas, Cauliflower)", 0.18, "kg", 46], ["Pav / Bread", 0.08, "kg", 60], ["Butter", 0.018, "kg", 480], ["Spices (Pav Bhaji Masala)", 0.006, "kg", 320]],
  "Rajma Chawal": [["Rice", 0.09, "kg", 52], ["Rajma (Kidney Beans)", 0.045, "kg", 150], ["Vegetables (Tomatoes & Onions)", 0.07, "kg", 46], ["Oil", 0.008, "L", 118], ["Spices", 0.005, "kg", 320]],
  "Upma": [["Suji (Semolina)", 0.08, "kg", 44], ["Vegetables", 0.06, "kg", 46], ["Oil", 0.012, "L", 118], ["Spices", 0.004, "kg", 320]],
  "Poha": [["Poha (Flattened Rice)", 0.08, "kg", 48], ["Vegetables", 0.04, "kg", 46], ["Oil", 0.008, "L", 118], ["Spices", 0.004, "kg", 320]],
  "Thepla": [["Atta (Wheat Flour)", 0.09, "kg", 42], ["Oil", 0.012, "L", 118], ["Spices", 0.005, "kg", 320]],
  "Pasta": [["Pasta", 0.09, "kg", 95], ["Vegetables (Tomatoes, Capsicum)", 0.1, "kg", 46], ["Oil (Olive / Vegetable)", 0.01, "L", 150], ["Cheese", 0.015, "kg", 450], ["Spices & Herbs", 0.004, "kg", 320]],
  "Pancakes": [["Maida / Flour", 0.08, "kg", 45], ["Milk", 0.08, "L", 60], ["Sugar", 0.02, "kg", 42], ["Butter", 0.01, "kg", 480], ["Baking Powder & Flavor", 0.003, "kg", 200]],
}

const RECIPE_TABLE: Record<string, { prepTimeMin: number; cookTimeMin: number; difficulty: "Easy" | "Medium" | "Advanced"; steps: string[]; tips: string[] }> = {
  "Dal Rice": {
    prepTimeMin: 15,
    cookTimeMin: 25,
    difficulty: "Easy",
    steps: [
      "Wash rice and dal separately until the water runs clear. Soak dal for 20 minutes to save cooking energy.",
      "Pressure cook dal with water, turmeric, salt, and chopped vegetables for 3 whistles on medium heat.",
      "In a separate pot, cook rice in twice the volume of water with a pinch of salt until fluffy.",
      "For tempering (tadka), heat oil/ghee in a small pan, add cumin, mustard seeds, green chilies, and garlic until aromatic.",
      "Pour the hot tadka over the cooked dal, stir well, and simmer for 3 minutes. Garnish with fresh coriander and serve hot over rice.",
    ],
    tips: [
      "Soaking the dal cuts cooking time and energy by up to 30%.",
      "Save leftover dal water (rasam/broth) to make soup or knead into dough.",
    ],
  },
  "Khichdi": {
    prepTimeMin: 10,
    cookTimeMin: 20,
    difficulty: "Easy",
    steps: [
      "Rinse equal parts rice and yellow moong dal together. Soak for 15 minutes.",
      "Heat ghee/oil in a cooker, add cumin seeds, hing (asafoetida), and whole spices.",
      "Add diced carrots, beans, and potatoes. Sauté for 2 minutes with turmeric and salt.",
      "Add the drained rice-dal mix and 4 times water for a creamy, comforting consistency.",
      "Pressure cook for 3 to 4 whistles. Let pressure release naturally, mix gently, and serve hot with curd or pickle.",
    ],
    tips: [
      "Khichdi is the ultimate zero-waste one-pot meal — any leftover vegetable trimmings work wonderfully.",
      "If any khichdi remains, shape into small patties and pan-sear for crispy evening snacks.",
    ],
  },
  "Paneer Butter Masala": {
    prepTimeMin: 20,
    cookTimeMin: 25,
    difficulty: "Medium",
    steps: [
      "Cut paneer into cubes and soak in warm water for 10 minutes to keep them soft.",
      "Boil roughly chopped onions, tomatoes, cashews, and whole spices in a little water until soft; blend into a smooth puree.",
      "Heat butter and a splash of oil in a pan, add ginger-garlic paste and sauté for 1 minute.",
      "Pour in the tomato-onion puree, add red chili powder, coriander powder, and garam masala. Cook until oil separates.",
      "Add warm water or milk to adjust gravy thickness, stir in kasuri methi and fresh cream, then gently fold in the paneer cubes. Simmer for 3 minutes.",
    ],
    tips: [
      "Use ripe surplus tomatoes to get naturally sweet, vibrant orange gravy without artificial coloring.",
      "Soaking paneer in warm water keeps low-fat paneer tender without deep frying.",
    ],
  },
  "Veg Biryani": {
    prepTimeMin: 25,
    cookTimeMin: 35,
    difficulty: "Medium",
    steps: [
      "Soak long-grain basmati rice for 30 minutes. Par-boil with whole spices (bay leaf, cloves, cardamom) until 70% cooked; drain.",
      "Marinate diced seasonal vegetables in curd, ginger-garlic, biryani masala, turmeric, mint, and coriander.",
      "Sauté sliced onions in oil/ghee until deep golden brown (birista) and set half aside.",
      "Cook the marinated vegetables in the remaining oil until 80% tender.",
      "Layer the cooked vegetables and par-boiled rice in a heavy pot. Top with fried onions, saffron milk, and mint. Seal and cook on 'dum' (low heat) for 15 minutes.",
    ],
    tips: [
      "Par-boiling rice in aromatic whole spice water infuses deep flavour throughout each grain.",
      "Great recipe for utilizing irregular or imperfect vegetables from local surplus.",
    ],
  },
  "Pav Bhaji": {
    prepTimeMin: 20,
    cookTimeMin: 30,
    difficulty: "Easy",
    steps: [
      "Boil potatoes, cauliflower, carrots, and green peas until completely tender, then mash thoroughly.",
      "Heat butter in a large flat tawa or skillet, sauté finely chopped onions, capsicum, and ginger-garlic paste.",
      "Add chopped tomatoes, pav bhaji masala, Kashmiri red chili powder, and salt. Cook until softened.",
      "Combine the mashed vegetables with the onion-tomato masala, adding water to achieve desired bhaji consistency.",
      "Simmer for 10 minutes while mashing continuously. Toast pav buns on hot buttered griddle and serve with onion wedges and lemon.",
    ],
    tips: [
      "Pav bhaji is ideal for salvaging assorted surplus vegetables without compromising texture or taste.",
    ],
  },
}

function getIngredientsForDish(dish: string): Array<[string, number, string, number]> {
  const normalized = dish.trim().toLowerCase()
  for (const [key, val] of Object.entries(INGREDIENT_TABLE)) {
    if (key.toLowerCase() === normalized) return val
  }
  if (normalized.includes("paneer")) return INGREDIENT_TABLE["Paneer Butter Masala"]
  if (normalized.includes("biryani") || normalized.includes("pulao")) return INGREDIENT_TABLE["Veg Biryani"]
  if (normalized.includes("khichdi")) return INGREDIENT_TABLE["Khichdi"]
  if (normalized.includes("pav") || normalized.includes("bhaji")) return INGREDIENT_TABLE["Pav Bhaji"]
  if (normalized.includes("rajma") || normalized.includes("chole") || normalized.includes("chickpea")) return INGREDIENT_TABLE["Rajma Chawal"]
  if (normalized.includes("roti") || normalized.includes("sabzi") || normalized.includes("curry")) return INGREDIENT_TABLE["Roti Sabzi"]
  if (normalized.includes("dal") || normalized.includes("sambar")) return INGREDIENT_TABLE["Dal Rice"]
  if (normalized.includes("pasta") || normalized.includes("macaroni") || normalized.includes("spaghetti")) return INGREDIENT_TABLE["Pasta"]
  if (normalized.includes("pancake") || normalized.includes("crepe") || normalized.includes("waffle")) return INGREDIENT_TABLE["Pancakes"]
  if (normalized.includes("poha")) return INGREDIENT_TABLE["Poha"]
  if (normalized.includes("upma")) return INGREDIENT_TABLE["Upma"]
  if (normalized.includes("thepla") || normalized.includes("paratha")) return INGREDIENT_TABLE["Thepla"]

  // Generic fallback with custom naming
  return [
    ["Primary Grain / Base", 0.09, "kg", 52],
    ["Main Protein / Lentils / Dairy", 0.04, "kg", 140],
    ["Cooking Oil / Ghee", 0.009, "L", 118],
    ["Fresh Vegetables / Aromatics", 0.08, "kg", 46],
    ["Seasonings & Spices", 0.005, "kg", 320],
  ]
}

function getRecipeForDish(dish: string) {
  for (const [key, val] of Object.entries(RECIPE_TABLE)) {
    if (dish.toLowerCase().includes(key.toLowerCase())) return val
  }
  return {
    prepTimeMin: 15,
    cookTimeMin: 25,
    difficulty: "Easy" as const,
    steps: [
      `Clean and prep all base ingredients and chop vegetables evenly for "${dish}".`,
      "Heat cooking medium (oil or ghee) in a heavy-bottomed vessel; sauté aromatics and spices until fragrant.",
      `Add the primary ingredients and vegetables. Cook covered on medium heat until tender and well integrated.`,
      "Season with salt, freshly ground spices, and herbs. Adjust consistency with water or stock as desired.",
      "Rest for 2 minutes before portioning to allow flavours to settle. Serve hot.",
    ],
    tips: [
      "Prepare in exact measured batch portions to minimize leftover waste.",
      "Store any leftover gravy or base chilled in airtight containers for reuse within 24 hours.",
    ],
  }
}

const FALLBACK_TABLE: Array<[string, number, string, number]> = [
  ["Rice", 0.09, "kg", 52], ["Dal", 0.035, "kg", 140], ["Oil", 0.008, "L", 118],
  ["Vegetables", 0.05, "kg", 46], ["Spices", 0.004, "kg", 320],
]

const BUFFER_RATE = 0.04 // 4% buffer — demo heuristic

export function planMeal(foodType: string, people: number): MealPlanResult {
  const meals = Math.max(1, Math.ceil(people * (1 + BUFFER_RATE)))
  const table = getIngredientsForDish(foodType)
  const ingredients: IngredientQty[] = table.map(([name, perMeal, unit, price]) => {
    const qty = Math.max(0.1, Math.round(perMeal * meals * 10) / 10)
    return { name, qty, unit, pricePerUnit: price }
  })
  const totalCost = Math.round(ingredients.reduce((s, i) => s + i.qty * i.pricePerUnit, 0))
  const recipe = getRecipeForDish(foodType)

  return {
    foodType, meals, ingredients, totalCost,
    costPerMeal: Math.round(totalCost / meals),
    extraMeals: meals - people,
    calculatedAt: new Date().toISOString(),
    recipe,
  }
}

export function recalcFromIngredients(ingredients: IngredientQty[], meals: number, foodType: string): MealPlanResult {
  const totalCost = Math.round(ingredients.reduce((s, i) => s + i.qty * i.pricePerUnit, 0))
  return {
    foodType, meals, ingredients, totalCost,
    costPerMeal: meals > 0 ? Math.round(totalCost / meals) : 0,
    extraMeals: 0,
    calculatedAt: new Date().toISOString(),
  }
}

// ---------- demand forecast ----------
export const DAY_TYPE_RATES: Record<string, { rate: number; label: string }> = {
  normal: { rate: 0.92, label: "Normal day" },
  weekend: { rate: 0.86, label: "Weekend (lower attendance)" },
  event: { rate: 1.05, label: "Event day (higher demand)" },
  festival: { rate: 1.12, label: "Festival (high demand)" },
  holiday: { rate: 0.78, label: "Holiday (reduced service)" },
}

export interface ForecastResult {
  expectedAttendance: number
  recommendedProduction: number
  expectedSurplus: number
  confidence: number
  attendanceRate: number
}

export function forecastDemand(registrations: number, dayType: string, historicalAvg = 0.9): ForecastResult {
  const dt = DAY_TYPE_RATES[dayType] ?? DAY_TYPE_RATES.normal
  // blend demo historical average with day-type rate (deterministic)
  const rate = Math.round(((dt.rate * 0.7 + historicalAvg * 0.3) * 100)) / 100
  const expectedAttendance = Math.round(registrations * rate)
  const recommendedProduction = Math.round(expectedAttendance * (1 + BUFFER_RATE)) + 6
  const expectedSurplus = Math.max(0, recommendedProduction - expectedAttendance)
  const confidence = Math.min(94, 70 + Math.round(registrations / 25))
  return { expectedAttendance, recommendedProduction, expectedSurplus, confidence, attendanceRate: rate }
}

// ---------- food assessment (deterministic demo rules) ----------
export interface AssessmentInput {
  foodName: string
  method: "photo" | "upload" | "barcode"
  hoursSincePrepared: number
  storageCondition: string
}

export interface AssessmentOutput {
  result: "eligible" | "review" | "not-eligible"
  reasons: string[]
  extractedText: string
  dateLabel: string
}

export function assessFood(input: AssessmentInput): AssessmentOutput {
  const { hoursSincePrepared: h, storageCondition: s } = input
  const chilled = /refrigerat|cold|chill/i.test(s)
  const hot = /hot|60/i.test(s)
  const frozen = /freez/i.test(s)
  const packaged = /pack|dry|ambient|shelf/i.test(s)
  const reasons: string[] = []

  let result: AssessmentOutput["result"] = "review"
  if (packaged) {
    if (h <= 48) { result = "eligible"; reasons.push("Packaged/dry goods — longer shelf life (demo rule)") }
    else if (h <= 120) { result = "review"; reasons.push("Packaged goods past typical best-before window — verify label") }
    else { result = "not-eligible"; reasons.push("Too old for redistribution pathway (demo rule)") }
  } else if (hot) {
    if (h <= 3) { result = "eligible"; reasons.push("Prepared under 3 hours ago", "Held hot above 60°C") }
    else { result = "not-eligible"; reasons.push("Hot-held food older than 3 hours (demo safety rule)") }
  } else if (chilled) {
    if (h <= 4) { result = "eligible"; reasons.push("Prepared under 4 hours ago", "Chilled storage slows spoilage (demo rule)") }
    else if (h <= 12) {
      result = "review"
      reasons.push(`Prepared ${h} hours ago — chilled, needs quick redistribution`)
      reasons.push("Review packaging and smell before sharing")
    }
    else { result = "not-eligible"; reasons.push(`Prepared ${h} hours ago — outside chilled window (demo rule)`) }
  } else if (frozen) {
    if (h <= 48) { result = "eligible"; reasons.push("Frozen storage — within demo redistribution window") }
    else { result = "review"; reasons.push("Long frozen storage — verify freezer log") }
  } else {
    // room temperature / unspecified
    if (h <= 2) { result = "eligible"; reasons.push("Prepared under 2 hours ago (room temperature rule)") }
    else if (h <= 4) { result = "review"; reasons.push("Room temperature storage — consume quickly, verify sensory check") }
    else { result = "not-eligible"; reasons.push("Room temperature food older than 4 hours (demo safety rule)") }
  }

  if (input.method === "barcode") reasons.push("Barcode scanned — demo OCR simulated")
  else reasons.push("Image screening simulated — demo result")

  const extractedText = `${input.foodName.toUpperCase()} · ${input.method === "barcode" ? "BARCODE" : "OCR"} DEMO · Storage: ${input.storageCondition}`
  const dateLabel = result === "eligible"
    ? "Within demo redistribution window"
    : result === "review" ? "Short window — prioritize" : "Outside redistribution window"
  return { result, reasons, extractedText, dateLabel }
}

// ---------- delivery partner matching (deterministic rules) ----------
// Core eligibility comes from STRUCTURED data only — no hard-coded city
// names. Basic rule: partner.city === request.pickupCity. Additional
// criteria (service area, capacity, vehicle, availability, delivery
// type, community-assistance preference) then rank suitable partners.
export interface PartnerMatch {
  partner: StandalonePartner
  score: number
  reasons: string[]
  suitable: boolean
}

export function matchPartners(req: DeliveryRequest, partners: StandalonePartner[]): PartnerMatch[] {
  return partners
    .map((p) => {
      const reasons: string[] = []
      let score = 0
      const pr = p.profile
      // Explicit structured city match — never hard-code a city name here.
      const sameCity = !!req.pickupCity && pr.city.trim().toLowerCase() === req.pickupCity.trim().toLowerCase()
      const capacityOk = pr.capacity >= req.quantity
      const vehicleOk = req.requiredVehicle.includes(pr.vehicleType)
      const available = pr.active
      const areaMatch = req.destArea.toLowerCase().split(/[ ,]/).some((w) => w.length > 3 && pr.serviceArea.toLowerCase().includes(w))
      const communityOk = req.type !== "community" || pr.communityAssistance

      if (sameCity) { score += 25; reasons.push(`City match: ${pr.city}`) } else reasons.push(`Different city: ${pr.city} (request pickup: ${req.pickupCity})`)
      if (capacityOk) { score += 25; reasons.push(`Capacity ${pr.capacity} ≥ ${req.quantity} ${req.unit}`) } else reasons.push(`Capacity too low (${pr.capacity} < ${req.quantity})`)
      if (vehicleOk) { score += 25; reasons.push(`Vehicle ${pr.vehicleType} suitable`) } else reasons.push(`Vehicle ${pr.vehicleType} not ideal (needs ${req.requiredVehicle.join("/")})`)
      if (available) { score += 10; reasons.push("Currently available") } else reasons.push("Currently inactive")
      if (areaMatch) { score += 10; reasons.push(`Service area covers destination`) }
      if (communityOk) { score += 5; reasons.push("Accepts this delivery type") } else reasons.push("Does not accept this delivery type")

      const suitable = sameCity && capacityOk && available && communityOk
      return { partner: p, score, reasons, suitable }
    })
    .sort((a, b) => b.score - a.score)
}

export const VEHICLE_OPTIONS = ["Bicycle", "Bike", "Scooter", "Auto", "Car", "Van", "Mini Truck", "Truck", "Other"]

export const DELIVERY_CATEGORIES = [
  "Kitchen → NGO", "Kitchen → Consumer", "NGO → Consumer", "NGO → Poor/Homeless",
  "User → User", "User → NGO", "Community Assistance",
]

// ---------- sustainability (DEMO/ESTIMATED factors) ----------
export const DEMO_FACTORS = {
  kgPerMeal: 0.5, // avg food weight per meal (demo estimate)
  co2ePerMealKg: 2.5, // WRAP-style factor, demo estimate
}

export function computeImpact(mealsRedistributed: number, mealsRecoveredKg: number, energyKwh: number) {
  return {
    mealsRedistributed,
    foodSavedKg: Math.round(mealsRedistributed * DEMO_FACTORS.kgPerMeal),
    co2eAvoidedKg: Math.round(mealsRedistributed * DEMO_FACTORS.co2ePerMealKg),
    foodRecoveredKg: Math.round(mealsRecoveredKg),
    energyKwh: Math.round(energyKwh),
  }
}

// ---------- misc ----------
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10
}

// City reference points live in the shared cities module.
export const DEMO_CITY_CENTERS: Record<string, { lat: number; lng: number }> = Object.fromEntries(
  DEMO_CITIES.map((c) => [c.name, { lat: c.lat, lng: c.lng }]),
)
