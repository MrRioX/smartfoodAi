// ============================================================
// POST /api/ai/demand-forecast — AI demand forecasting
// Inputs: registrations, day type, historical averages, events.
// Falls back to the deterministic demo forecast when AI is not
// configured. The user can always override the numbers in the UI.
// ============================================================
import { NextResponse } from "next/server"
import { aiJson, isAiConfigured } from "@/lib/ai/client"
import { jsonSystemPrompt } from "@/lib/ai/prompts"
import { AiConfigError, AiParseError, AiRequestError } from "@/lib/ai/errors"
import { forecastDemand } from "@/lib/calc"

interface ForecastRequest {
  registrations: number
  dayType: string
  historicalAvg?: number
  event?: string
  previousProduction?: number
  previousConsumption?: number
  previousSurplus?: number
}

export async function POST(req: Request) {
  let body: ForecastRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const registrations = Math.max(1, Math.round(Number(body.registrations) || 1))
  const dayType = (body.dayType ?? "normal").trim()
  const historicalAvg = Number(body.historicalAvg) || 0.9

  const demo = forecastDemand(registrations, dayType, historicalAvg)

  if (!isAiConfigured()) {
    return NextResponse.json({ ...demo, reasoning: "Deterministic demo model (day-type rate blended with historical average).", engine: { source: "demo", fallbackReason: "AI service is not configured — showing demo calculation." } })
  }

  try {
    const { data, model } = await aiJson<{
      expectedAttendance: number
      recommendedProduction: number
      expectedSurplus: number
      confidence: number
      attendanceRate: number
      reasoning: string
    }>({
      schemaHint:
        '{"expectedAttendance": number, "recommendedProduction": number, "expectedSurplus": number, "confidence": number (0-100), "attendanceRate": number (0-1), "reasoning": string (max 40 words)}',
      messages: [
        { role: "system", content: jsonSystemPrompt("recommendedProduction should cover expectedAttendance plus a small safety buffer.") },
        {
          role: "user",
          content:
            `Forecast meal demand for a community kitchen.\n` +
            `Registrations: ${registrations}\nDay type: ${dayType}\nHistorical attendance average: ${Math.round(historicalAvg * 100)}%\n` +
            (body.event ? `Event: ${body.event}\n` : "") +
            (body.previousProduction ? `Previous production: ${body.previousProduction} meals\n` : "") +
            (body.previousConsumption ? `Previous consumption: ${body.previousConsumption} meals\n` : "") +
            (body.previousSurplus ? `Previous surplus: ${body.previousSurplus} meals\n` : "") +
            `Return expected attendance, recommended production, expected surplus, confidence and short reasoning.`,
        },
      ],
    })

    return NextResponse.json({
      expectedAttendance: Math.max(0, Math.round(Number(data.expectedAttendance) || demo.expectedAttendance)),
      recommendedProduction: Math.max(0, Math.round(Number(data.recommendedProduction) || demo.recommendedProduction)),
      expectedSurplus: Math.max(0, Math.round(Number(data.expectedSurplus) || demo.expectedSurplus)),
      confidence: Math.min(99, Math.max(0, Math.round(Number(data.confidence) || demo.confidence))),
      attendanceRate: Number(data.attendanceRate) || demo.attendanceRate,
      reasoning: String(data.reasoning ?? "").slice(0, 300),
      engine: { source: "ai", model },
    })
  } catch (e) {
    const reason =
      e instanceof AiConfigError
        ? "AI service is not configured."
        : e instanceof AiParseError
          ? "AI response could not be parsed. Using demo calculation."
          : "AI request failed. Using demo calculation."
    return NextResponse.json({ ...demo, reasoning: "Deterministic demo model (fallback).", engine: { source: "demo", fallbackReason: reason } })
  }
}
