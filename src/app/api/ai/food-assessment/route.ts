// ============================================================
// POST /api/ai/food-assessment — AI vision food screening
// Receives an optional image (data URL), food metadata, and OCR /
// barcode text captured in the browser, sends them to the
// configured VISION model and returns a structured result:
//   { foodName, visibleIssues, packagingCondition, dateText,
//     barcodeText, qualityConcerns, confidence, recommendation,
//     humanReviewRequired }
// recommendation: "eligible" | "review" | "not-eligible"
// Falls back to deterministic demo rules, clearly labelled.
// This is AI-assisted screening — NOT a food-safety certification.
// ============================================================
import { NextResponse } from "next/server"
import { aiJson, isAiConfigured } from "@/lib/ai/client"
import { jsonSystemPrompt } from "@/lib/ai/prompts"
import { AiConfigError, AiParseError, AiRequestError } from "@/lib/ai/errors"
import { assessFood } from "@/lib/calc"

interface AssessmentRequest {
  imageDataUrl?: string // base64 data URL from camera/file input
  foodName?: string
  hoursSincePrepared?: number
  storageCondition?: string
  barcodeText?: string
  ocrText?: string
}

interface VisionResult {
  foodName: string
  visibleIssues: string[]
  packagingCondition: string
  dateText: string
  barcodeText: string
  qualityConcerns: string[]
  confidence: number
  recommendation: "eligible" | "review" | "not-eligible"
  humanReviewRequired: boolean
  notes?: string
}

export async function POST(req: Request) {
  let body: AssessmentRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const foodName = (body.foodName ?? "").trim() || "Unknown food"
  const hours = Math.max(0, Number(body.hoursSincePrepared) || 0)
  const storage = (body.storageCondition ?? "").trim() || "Unspecified"
  const hasImage = typeof body.imageDataUrl === "string" && body.imageDataUrl.startsWith("data:image/")

  // Deterministic demo fallback — also the baseline when AI fails.
  const demo = assessFood({
    foodName,
    method: body.barcodeText ? "barcode" : hasImage ? "photo" : "upload",
    hoursSincePrepared: hours,
    storageCondition: storage,
  })

  if (!isAiConfigured()) {
    return NextResponse.json({
      foodName,
      visibleIssues: [] as string[],
      packagingCondition: storage,
      dateText: demo.dateLabel ?? "",
      barcodeText: body.barcodeText ?? "",
      qualityConcerns: demo.reasons,
      confidence: 55,
      recommendation: demo.result,
      humanReviewRequired: demo.result !== "eligible",
      notes: demo.reasons.join(" · "),
      engine: { source: "demo", fallbackReason: "AI service is not configured — showing deterministic demo screening." },
    })
  }

  try {
    const { data, model } = await aiJson<VisionResult>({
      schemaHint:
        '{"foodName": string, "visibleIssues": string[], "packagingCondition": string, "dateText": string, "barcodeText": string, "qualityConcerns": string[], "confidence": number, "recommendation": "eligible"|"review"|"not-eligible", "humanReviewRequired": boolean, "notes": string}',
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: jsonSystemPrompt(
            "If the image is unclear or information is missing, use recommendation \"review\" and set humanReviewRequired=true. Only return \"eligible\" when the evidence supports redistribution.",
          ),
        },
        {
          role: "user",
          content:
            `Screen this food item for free-food redistribution eligibility.\n` +
            `Reported food name: ${foodName}\nHours since prepared/packed: ${hours}\nStorage condition: ${storage}\n` +
            (body.barcodeText ? `Barcode text captured by the device scanner: ${body.barcodeText}\n` : "") +
            (body.ocrText ? `OCR text captured by the device: ${body.ocrText}\n` : "") +
            (hasImage
              ? "An image of the food is attached. Assess visible issues (spoilage, discolouration, damaged packaging, temperature cues) and packaging condition."
              : "No image attached — base the assessment on the metadata provided."),
          ...(hasImage ? { images: [body.imageDataUrl!] } : {}),
        },
      ],
    })

    const recommendation = data.recommendation === "eligible" || data.recommendation === "not-eligible" ? data.recommendation : "review"
    return NextResponse.json({
      foodName: String(data.foodName || foodName),
      visibleIssues: (Array.isArray(data.visibleIssues) ? data.visibleIssues : []).slice(0, 6).map(String),
      packagingCondition: String(data.packagingCondition || storage),
      dateText: String(data.dateText ?? ""),
      barcodeText: String(data.barcodeText ?? body.barcodeText ?? ""),
      qualityConcerns: (Array.isArray(data.qualityConcerns) ? data.qualityConcerns : []).slice(0, 6).map(String),
      confidence: Math.min(99, Math.max(0, Math.round(Number(data.confidence) || 60))),
      recommendation,
      humanReviewRequired: recommendation !== "eligible" || data.humanReviewRequired === true,
      notes: String(data.notes ?? "").slice(0, 400),
      engine: { source: "ai", model },
    })
  } catch (e) {
    const reason =
      e instanceof AiConfigError
        ? "AI service is not configured."
        : e instanceof AiParseError
          ? "AI response could not be parsed. Using demo screening."
          : e instanceof AiRequestError
            ? "AI request failed. Using demo screening."
            : "AI request failed. Using demo screening."
    return NextResponse.json({
      foodName,
      visibleIssues: [],
      packagingCondition: storage,
      dateText: demo.dateLabel ?? "",
      barcodeText: body.barcodeText ?? "",
      qualityConcerns: demo.reasons,
      confidence: 55,
      recommendation: demo.result,
      humanReviewRequired: demo.result !== "eligible",
      notes: demo.reasons.join(" · "),
      engine: { source: "demo", fallbackReason: reason },
    })
  }
}
