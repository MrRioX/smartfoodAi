// ============================================================
// POST /api/ai/processing-analysis — kitchen/processing insights
// Server computes the core metrics from actual production records;
// AI adds processing-efficiency explanation and suggestions only.
// ============================================================
import { NextResponse } from "next/server"
import { aiJson, isAiConfigured } from "@/lib/ai/client"
import { jsonSystemPrompt } from "@/lib/ai/prompts"
import { AiParseError, AiRequestError } from "@/lib/ai/errors"

interface ProcessingBody {
  orgName?: string
  planned?: number
  produced?: number
  consumed?: number
  surplus?: number
  energyKwh?: number
  machineDowntimeMin?: number
  rawMaterialLossKg?: number
}

export async function POST(req: Request) {
  let body: ProcessingBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const produced = Math.max(0, Number(body.produced) || 0)
  const consumed = Math.max(0, Number(body.consumed) || 0)
  const surplus = Math.max(0, Number(body.surplus) || Math.max(0, produced - consumed))

  if (!isAiConfigured()) {
    return NextResponse.json({
      insights: [
        `Surplus ratio: ${produced > 0 ? Math.round((surplus / produced) * 100) : 0}% of production — list surplus for free redistribution before it expires.`,
        "AI service is not configured — showing rule-based demo insight.",
      ],
      engine: { source: "demo", fallbackReason: "AI service is not configured." },
    })
  }

  try {
    const { data, model } = await aiJson<{ insights: string[] }>({
      schemaHint: '{"insights": string[] (3-5 short bullets)}',
      messages: [
        { role: "system", content: jsonSystemPrompt("Use ONLY the provided numbers; do not invent inventory or production data.") },
        {
          role: "user",
          content:
            `Processing summary for ${body.orgName ?? "kitchen"}:\n` +
            `Planned: ${body.planned ?? "n/a"} · Produced: ${produced} · Consumed: ${consumed} · Surplus: ${surplus}\n` +
            (body.energyKwh != null ? `Energy: ${body.energyKwh} kWh\n` : "") +
            (body.machineDowntimeMin != null ? `Machine downtime: ${body.machineDowntimeMin} min\n` : "") +
            (body.rawMaterialLossKg != null ? `Raw material loss: ${body.rawMaterialLossKg} kg\n` : "") +
            `\nGive 3-5 short efficiency + surplus-prevention insights.`,
        },
      ],
    })

    return NextResponse.json({
      insights: (Array.isArray(data.insights) ? data.insights : []).slice(0, 6).map(String),
      engine: { source: "ai", model },
    })
  } catch (e) {
    const reason = e instanceof AiParseError ? "AI response could not be parsed." : "AI request failed."
    return NextResponse.json({
      insights: ["AI request failed — showing rule-based demo insight."],
      engine: { source: "demo", fallbackReason: reason },
    })
  }
}
