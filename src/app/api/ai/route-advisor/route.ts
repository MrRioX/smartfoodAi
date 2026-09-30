// ============================================================
// POST /api/ai/route-advisor — Gemini Route Finding & Distribution Optimization
// Uses Google Gemini to predict route conditions, optimal path,
// delivery duration, traffic advisory, and food temperature holding limits.
// ============================================================
import { NextResponse } from "next/server"
import { aiJson, isAiConfigured } from "@/lib/ai/client"
import { jsonSystemPrompt } from "@/lib/ai/prompts"
import { AiParseError, AiRequestError } from "@/lib/ai/errors"

interface RouteRequest {
  pickup: {
    name: string
    area?: string
    lat: number
    lng: number
  }
  destination: {
    name: string
    area?: string
    lat: number
    lng: number
  }
  foodDescription?: string
  quantity?: number
  unit?: string
  vehicleType?: string
}

export async function POST(req: Request) {
  let body: RouteRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const { pickup, destination, foodDescription = "Cooked Meals", quantity = 25, unit = "meals", vehicleType = "Bike / Auto" } = body
  if (!pickup || !destination) {
    return NextResponse.json({ error: "Missing pickup or destination coordinates." }, { status: 400 })
  }

  if (!isAiConfigured()) {
    return NextResponse.json({
      recommendedRoute: `${pickup.name} → Direct Arterial Corridor → ${destination.name}`,
      estimatedDurationMin: 25,
      optimalSpeedKmph: 35,
      foodHoldingTimeMaxHours: 4,
      safetyAdvisory: "Maintain hot food in insulated bags above 60°C or chilled foods below 5°C.",
      checkpoints: [pickup.name, "Midway Transit Junction", destination.name],
      engine: { source: "demo", fallbackReason: "Gemini AI is not configured." },
    })
  }

  try {
    const { data, model } = await aiJson<{
      recommendedRoute: string
      estimatedDurationMin: number
      optimalSpeedKmph: number
      foodHoldingTimeMaxHours: number
      safetyAdvisory: string
      checkpoints: string[]
    }>({
      schemaHint:
        '{"recommendedRoute": string, "estimatedDurationMin": number, "optimalSpeedKmph": number, "foodHoldingTimeMaxHours": number, "safetyAdvisory": string, "checkpoints": string[]}',
      messages: [
        {
          role: "system",
          content: jsonSystemPrompt(
            "You are an expert AI logistics and food safety distribution coordinator for India. Analyze optimal routes, transit time, traffic bottlenecks, and food safety holding constraints.",
          ),
        },
        {
          role: "user",
          content:
            `Analyze optimal food distribution route for delivery:\n` +
            `Pickup: ${pickup.name} (${pickup.area ?? ""}) [Lat: ${pickup.lat}, Lng: ${pickup.lng}]\n` +
            `Destination: ${destination.name} (${destination.area ?? ""}) [Lat: ${destination.lat}, Lng: ${destination.lng}]\n` +
            `Load: ${quantity} ${unit} of "${foodDescription}"\n` +
            `Vehicle: ${vehicleType}\n` +
            `Provide recommended road route name, estimated duration in minutes, optimal transit speed (km/h), max safe food holding time in hours, specific food safety advisory, and major waypoint checkpoints.`,
        },
      ],
    })

    return NextResponse.json({
      recommendedRoute: String(data.recommendedRoute ?? "Direct Highway Corridor"),
      estimatedDurationMin: Math.max(5, Math.round(Number(data.estimatedDurationMin) || 20)),
      optimalSpeedKmph: Math.max(10, Math.round(Number(data.optimalSpeedKmph) || 35)),
      foodHoldingTimeMaxHours: Number(data.foodHoldingTimeMaxHours) || 4,
      safetyAdvisory: String(data.safetyAdvisory ?? "Keep food properly insulated during transit."),
      checkpoints: Array.isArray(data.checkpoints) ? data.checkpoints.slice(0, 6) : [pickup.name, destination.name],
      engine: { source: "ai", model },
    })
  } catch (e) {
    const reason = e instanceof AiParseError ? "AI response could not be parsed." : "AI route analysis failed."
    return NextResponse.json({
      recommendedRoute: `${pickup.name} → Main Link Road → ${destination.name}`,
      estimatedDurationMin: 25,
      optimalSpeedKmph: 35,
      foodHoldingTimeMaxHours: 4,
      safetyAdvisory: "Maintain food in insulated thermal cases during transit.",
      checkpoints: [pickup.name, destination.name],
      engine: { source: "demo", fallbackReason: reason },
    })
  }
}
