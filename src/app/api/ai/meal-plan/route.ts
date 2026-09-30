// ============================================================
// POST /api/ai/meal-plan — AI meal planning (server-side)
// Uses the configured OpenAI-compatible model when available and
// falls back to the deterministic demo calculation (clearly
// labelled). Prices come from the demo price data layer for the
// selected city — the AI never invents prices.
// ============================================================
import { NextResponse } from "next/server"
import { aiJson, isAiConfigured } from "@/lib/ai/client"
import { jsonSystemPrompt } from "@/lib/ai/prompts"
import { AiConfigError, AiParseError, AiRequestError } from "@/lib/ai/errors"
import { getCityPrices } from "@/lib/ingredient-prices"
import { planMeal } from "@/lib/calc"

interface PlanRequest {
  foodType: string
  people: number
  location?: string
  availableIngredients?: Array<{ name: string; qty: number; unit: string }>
  includeRecipe?: boolean
}

export async function POST(req: Request) {
  let body: PlanRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const foodType = (body.foodType ?? "").trim() || "Dal Rice"
  const people = Math.max(1, Math.round(Number(body.people) || 1))
  const location = (body.location ?? "").trim() || "Ahmedabad"
  const available = Array.isArray(body.availableIngredients) ? body.availableIngredients : []
  const includeRecipe = body.includeRecipe ?? true

  // Deterministic fallback — always computed so the demo keeps working.
  const demo = planMeal(foodType, people)

  if (!isAiConfigured()) {
    return NextResponse.json({ ...demo, engine: { source: "demo", fallbackReason: "AI service is not configured — showing demo calculation." } })
  }

  // Structured price data for the selected city (never invented by AI).
  const prices = getCityPrices(location)
    .map((p) => `${p.ingredient}: ₹${p.price}/${p.unit}`)
    .join("; ")

  try {
    const { data, model } = await aiJson<{
      meals: number
      ingredients: Array<{ name: string; qty: number; unit: string; pricePerUnit: number }>
      totalCost: number
      costPerMeal: number
      extraMeals: number
      assumptions: string[]
      recipe?: {
        prepTimeMin: number
        cookTimeMin: number
        difficulty: "Easy" | "Medium" | "Advanced"
        steps: string[]
        tips: string[]
      }
    }>({
      schemaHint:
        '{"meals": number, "ingredients": [{"name": string, "qty": number, "unit": "kg|L|g|ml", "pricePerUnit": number}], "totalCost": number, "costPerMeal": number, "extraMeals": number, "assumptions": string[], "recipe": {"prepTimeMin": number, "cookTimeMin": number, "difficulty": "Easy|Medium|Advanced", "steps": string[], "tips": string[]}}',
      messages: [
        {
          role: "system",
          content: jsonSystemPrompt(
            "ingredients/totalCost must be consistent. Use ONLY the provided city price list for prices (₹). Provide step-by-step cooking recipe and zero-waste cooking tips.",
          ),
        },
        {
          role: "user",
          content: `The user wants to make "${foodType}" for ${people} people in ${location}, India.\n` +
            `Tell them the exact ingredients required and how much quantity to make for ${people} people.\n` +
            `City ingredient prices (demo dataset): ${prices}\n` +
            (available.length
              ? `Already available stock: ${available.map((a) => `${a.name} ${a.qty}${a.unit}`).join(", ")} — subtract from purchase list where realistic.\n`
              : "") +
            (includeRecipe ? `Provide a step-by-step cooking recipe, prep time, cooking time, and zero-food-waste tips.\n` : "") +
            `Recommend total meals (people + small buffer), per-ingredient quantities and costs. Keep quantities realistic.`,
        },
      ],
    })

    return NextResponse.json({
      foodType,
      meals: Math.max(1, Math.round(Number(data.meals) || people)),
      ingredients: (data.ingredients ?? []).map((i) => ({
        name: String(i.name ?? "Ingredient"),
        qty: Math.max(0, Number(i.qty) || 0),
        unit: String(i.unit ?? "kg"),
        pricePerUnit: Math.max(0, Number(i.pricePerUnit) || 0),
      })),
      totalCost: Math.max(0, Math.round(Number(data.totalCost) || 0)),
      costPerMeal: Math.max(0, Math.round(Number(data.costPerMeal) || 0)),
      extraMeals: Math.max(0, Math.round(Number(data.extraMeals) || 0)),
      assumptions: Array.isArray(data.assumptions) ? data.assumptions.slice(0, 5) : [],
      recipe: data.recipe ?? demo.recipe,
      calculatedAt: new Date().toISOString(),
      engine: { source: "ai", model },
    })
  } catch (e) {
    const reason =
      e instanceof AiConfigError
        ? "AI service is not configured."
        : e instanceof AiRequestError
          ? "AI request failed. Using demo calculation."
          : e instanceof AiParseError
            ? "AI response could not be parsed. Using demo calculation."
            : "AI request failed. Using demo calculation."
    return NextResponse.json({ ...demo, engine: { source: "demo", fallbackReason: reason } })
  }
}
