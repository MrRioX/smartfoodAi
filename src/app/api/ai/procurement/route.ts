// ============================================================
// POST /api/ai/procurement — procurement recommendations
// Quantities (required / stock / recommended buy) are computed by
// the server from ACTUAL stored inventory values — the AI only
// adds explanation and risk insight. It cannot fabricate stock.
// ============================================================
import { NextResponse } from "next/server"
import { aiJson, isAiConfigured } from "@/lib/ai/client"
import { jsonSystemPrompt } from "@/lib/ai/prompts"
import { AiConfigError, AiParseError, AiRequestError } from "@/lib/ai/errors"

interface ProcurementRow {
  name: string
  category: string
  quantity: number
  unit: string
  required: number
  recommendedBuy: number
  status?: string
}

interface ProcurementRequest {
  orgName?: string
  rows: ProcurementRow[]
}

export async function POST(req: Request) {
  let body: ProcurementRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const rows = Array.isArray(body.rows) ? body.rows.slice(0, 25) : []
  if (!isAiConfigured()) {
    return NextResponse.json({
      insights: ["AI service is not configured — showing rule-based demo insight."],
      engine: { source: "demo", fallbackReason: "AI service is not configured." },
    })
  }

  try {
    const { data, model } = await aiJson<{ insights: string[]; expiryRisks?: string[] }>({
      schemaHint: '{"insights": string[] (3-5 short actionable bullets), "expiryRisks": string[] (optional, item names at expiry risk)}',
      messages: [
        { role: "system", content: jsonSystemPrompt("Base every statement ONLY on the supplied rows. Never invent stock numbers.") },
        {
          role: "user",
          content:
            `Kitchen inventory vs 7-day requirement (units as given):\n` +
            rows
              .map((r) => `- ${r.name} (${r.category}): stock ${r.quantity} ${r.unit}, 7-day need ${r.required} ${r.unit}, recommended buy ${r.recommendedBuy} ${r.unit}${r.status ? `, status ${r.status}` : ""}`)
              .join("\n") +
            `\nGive 3-5 short procurement insights: what to buy now, what to delay, overstock to donate, possible expiry risks.`,
        },
      ],
    })

    return NextResponse.json({
      insights: (Array.isArray(data.insights) ? data.insights : []).slice(0, 6).map(String),
      expiryRisks: Array.isArray(data.expiryRisks) ? data.expiryRisks.slice(0, 6).map(String) : [],
      engine: { source: "ai", model },
    })
  } catch (e) {
    const reason = e instanceof AiParseError ? "AI response could not be parsed. Using demo insight." : "AI request failed. Using demo insight."
    return NextResponse.json({
      insights: ["AI request failed — rule-based recommendation table below remains valid."],
      engine: { source: "demo", fallbackReason: reason },
    })
  }
}
