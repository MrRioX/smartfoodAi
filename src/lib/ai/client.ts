// ============================================================
// SmartFood AI — reusable server-side AI client
// Supports both Google Gemini Native API and OpenAI-compatible endpoints.
// Reads configuration from environment variables ONLY:
//   AI_BASE_URL, AI_API_KEY, AI_MODEL, AI_VISION_MODEL, AI_PROVIDER
// The key never leaves the server.
// ============================================================
import { AiConfigError, AiParseError, AiRequestError } from "./errors"
import type { AiChatMessage, AiJsonOptions } from "./types"

export interface AiConfig {
  provider: string
  baseUrl: string
  apiKey: string
  model: string
  visionModel: string
  isGemini: boolean
}

/** Reads AI env vars. Throws AiConfigError when not configured. */
export function getAiConfig(): AiConfig {
  const provider = (process.env.AI_PROVIDER ?? "").trim().toLowerCase()
  const apiKey = (process.env.AI_API_KEY ?? process.env.GEMINI_API_KEY ?? "").trim()
  const baseUrl = (process.env.AI_BASE_URL ?? "").trim().replace(/\/+$/, "")
  const model = (process.env.AI_MODEL ?? "").trim() || (provider === "gemini" || apiKey.startsWith("AIza") || apiKey.startsWith("AQ.") ? "gemini-flash-lite-latest" : "")
  const visionModel = (process.env.AI_VISION_MODEL ?? "").trim() || model

  const isGemini = provider === "gemini" || baseUrl.includes("generativelanguage.googleapis.com") || apiKey.startsWith("AIza") || apiKey.startsWith("AQ.")

  if (!apiKey || (!isGemini && (!baseUrl || !model))) {
    throw new AiConfigError()
  }

  return {
    provider: isGemini ? "gemini" : provider,
    baseUrl: baseUrl || "https://generativelanguage.googleapis.com/v1beta",
    apiKey,
    model: model || "gemini-flash-lite-latest",
    visionModel: visionModel || "gemini-flash-lite-latest",
    isGemini,
  }
}

/** True when the app has a real AI API configured. */
export function isAiConfigured(): boolean {
  try {
    getAiConfig()
    return true
  } catch {
    return false
  }
}

/** Internal: strip markdown fences / prose and parse the first JSON object. */
export function extractJson<T>(raw: string): T {
  let text = raw.trim()
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) text = fence[1].trim()
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start === -1 || end === -1 || end <= start) throw new AiParseError("Failed to parse JSON from AI response")
  return JSON.parse(text.slice(start, end + 1)) as T
}

/**
 * Calls Gemini API or OpenAI-compatible endpoint and returns parsed JSON.
 */
export async function aiJson<T>(opts: AiJsonOptions): Promise<{ data: T; model: string }> {
  const cfg = getAiConfig()

  if (cfg.isGemini) {
    return callGeminiJson<T>(cfg, opts)
  }

  return callOpenAiJson<T>(cfg, opts)
}

/** Google Gemini Native generateContent Implementation */
async function callGeminiJson<T>(cfg: AiConfig, opts: AiJsonOptions): Promise<{ data: T; model: string }> {
  const system = opts.messages.find((m) => m.role === "system")
  const rest = opts.messages.filter((m) => m !== system)

  const parts: Array<Record<string, unknown>> = []

  // Combine system instructions and schema hint into request
  const systemInstruction = system ? `${system.content}\n${opts.schemaHint}` : opts.schemaHint

  for (const m of rest) {
    if (m.images && m.images.length > 0) {
      for (const img of m.images) {
        // img is a data URL: data:image/jpeg;base64,...
        const match = img.match(/^data:([^;]+);base64,(.+)$/)
        if (match) {
          parts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          })
        }
      }
    }
    parts.push({ text: m.content })
  }

  const payload: Record<string, unknown> = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: opts.temperature ?? 0.2,
      maxOutputTokens: opts.maxTokens ?? 2048,
    },
  }

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }],
    }
  }

  const targetModel = opts.messages.some((m) => m.images && m.images.length > 0)
    ? cfg.visionModel
    : cfg.model

  const cleanModel = targetModel.replace(/^models\//, "")
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${encodeURIComponent(cfg.apiKey)}`

  let res: Response
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(45_000),
    })
  } catch (e) {
    throw new AiRequestError(e instanceof Error ? `Gemini API request failed: ${e.message}` : "Gemini API request failed.")
  }

  if (!res.ok) {
    throw new AiRequestError(`Gemini API responded with status ${res.status}.`, res.status)
  }

  const data = await res.json().catch(() => null)
  const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!candidateText) {
    throw new AiParseError("Gemini response was empty or blocked by safety filters.")
  }

  return {
    data: extractJson<T>(candidateText),
    model: cleanModel,
  }
}

/** Standard OpenAI-compatible /chat/completions Implementation */
async function callOpenAiJson<T>(cfg: AiConfig, opts: AiJsonOptions): Promise<{ data: T; model: string }> {
  const system = opts.messages.find((m) => m.role === "system")
  const rest = opts.messages.filter((m) => m !== system)

  const payloadMessages: Array<Record<string, unknown>> = []
  payloadMessages.push({
    role: "system",
    content: `${system?.content ?? ""}\n${opts.schemaHint}`.trim(),
  })
  for (const m of rest) {
    if (m.images && m.images.length > 0) {
      payloadMessages.push({
        role: m.role,
        content: [
          { type: "text", text: m.content },
          ...m.images.map((url) => ({ type: "image_url", image_url: { url } })),
        ],
      })
    } else {
      payloadMessages.push({ role: m.role, content: m.content })
    }
  }

  let res: Response
  try {
    res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        messages: payloadMessages,
        temperature: opts.temperature ?? 0.2,
        max_tokens: opts.maxTokens ?? 1400,
      }),
      signal: AbortSignal.timeout(45_000),
    })
  } catch (e) {
    throw new AiRequestError(e instanceof Error ? `AI request failed: ${e.message}` : "AI request failed.")
  }

  if (!res.ok) {
    throw new AiRequestError(`AI provider responded with status ${res.status}.`, res.status)
  }

  const data = (await res.json().catch(() => null)) as
    | { choices?: Array<{ message?: { content?: string } }> }
    | null
  const content = data?.choices?.[0]?.message?.content
  if (!content) throw new AiParseError("AI response was empty.")
  return { data: extractJson<T>(content), model: cfg.model }
}
