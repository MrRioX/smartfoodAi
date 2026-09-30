// ============================================================
// SmartFood AI — reusable server-side prompt fragments
// Prompts only receive relevant structured data — never DB
// secrets, credentials or full tables.
// ============================================================

export const SAFETY_FOOTER =
  "You are assisting a food-redistribution prototype. You are NOT a food-safety authority. " +
  "When uncertain, always choose the cautious option and set humanReviewRequired=true."

/** Wraps a schema hint so the model emits strict JSON. */
export function jsonSystemPrompt(schemaHint: string, extra?: string): string {
  return [
    "You are SmartFood Assistant, an analytics helper for a food-waste-prevention platform.",
    "Respond with VALID JSON ONLY — no markdown fences, no commentary before or after.",
    `JSON shape: ${schemaHint}`,
    extra ? extra : "",
    SAFETY_FOOTER,
  ]
    .filter(Boolean)
    .join("\n")
}
