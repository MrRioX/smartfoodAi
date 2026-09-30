// ============================================================
// POST /api/ai/logistics-analysis — delivery partner ranking
// Eligibility is computed from STRUCTURED data (city, vehicle,
// capacity, availability, community-assistance preference) — the
// AI never invents partner availability, it only explains/ranks
// the pre-verified candidates.
// ============================================================
import { NextResponse } from "next/server"
import { aiJson, isAiConfigured } from "@/lib/ai/client"
import { jsonSystemPrompt } from "@/lib/ai/prompts"
import { AiParseError, AiRequestError } from "@/lib/ai/errors"
import { matchPartners } from "@/lib/calc"
import type { DeliveryRequest, StandalonePartner } from "@/lib/types"

interface LogisticsBody {
  request: DeliveryRequest
  partners: StandalonePartner[]
}

export async function POST(req: Request) {
  let body: LogisticsBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const { request, partners } = body
  if (!request || !Array.isArray(partners)) {
    return NextResponse.json({ error: "Missing request or partners." }, { status: 400 })
  }

  // Deterministic structured matching FIRST (source of truth).
  const matches = matchPartners(request, partners)
  const suitable = matches.filter((m) => m.suitable)

  if (!isAiConfigured()) {
    return NextResponse.json({
      ranking: matches.slice(0, 5).map((m) => ({ id: m.partner.id, name: m.partner.name, score: m.score, suitable: m.suitable, reasons: m.reasons })),
      explanation: "Deterministic rule-based matching (city → capacity → vehicle → availability → service area). AI explanation unavailable.",
      engine: { source: "demo", fallbackReason: "AI service is not configured." },
    })
  }

  try {
    const { data, model } = await aiJson<{ explanation: string; notes?: string[] }>({
      schemaHint: '{"explanation": string (max 60 words), "notes": string[] (optional per-partner cautions)}',
      messages: [
        { role: "system", content: jsonSystemPrompt("Eligibility was already computed from structured data. ONLY explain the ranking — never add or remove partners.") },
        {
          role: "user",
          content:
            `Delivery request: ${request.quantity} ${request.unit} "${request.foodDescription}" from ${request.pickupArea} (city ${request.pickupCity}) to ${request.destArea}. Needs vehicle: ${request.requiredVehicle.join("/")}. Type: ${request.type}.\n` +
            `Pre-computed partner matches:\n` +
            matches
              .slice(0, 6)
              .map((m) => `- ${m.partner.name}: city ${m.partner.profile.city}, ${m.partner.profile.vehicleType}, capacity ${m.partner.profile.capacity}, ${m.partner.profile.active ? "available" : "inactive"}, community=${m.partner.profile.communityAssistance}, score ${m.score}, suitable=${m.suitable} (${m.reasons.join("; ")})`)
              .join("\n") +
            `\nExplain the ranking briefly and flag any cautions (e.g. small vehicle for large load).`,
        },
      ],
    })

    return NextResponse.json({
      ranking: matches.slice(0, 5).map((m) => ({ id: m.partner.id, name: m.partner.name, score: m.score, suitable: m.suitable, reasons: m.reasons })),
      explanation: String(data.explanation ?? "").slice(0, 500),
      notes: Array.isArray(data.notes) ? data.notes.slice(0, 5).map(String) : [],
      suitableCount: suitable.length,
      engine: { source: "ai", model },
    })
  } catch (e) {
    const reason = e instanceof AiParseError ? "AI response could not be parsed." : "AI request failed."
    return NextResponse.json({
      ranking: matches.slice(0, 5).map((m) => ({ id: m.partner.id, name: m.partner.name, score: m.score, suitable: m.suitable, reasons: m.reasons })),
      explanation: "Rule-based matching shown (AI explanation unavailable).",
      engine: { source: "demo", fallbackReason: reason },
    })
  }
}
