// ============================================================
// SmartFood AI — server-side AI service types
// The AI key stays on the server; these types describe the
// structured payloads exchanged with the OpenAI-compatible API.
// ============================================================

/** One chat message for the OpenAI-compatible completions API. */
export interface AiChatMessage {
  role: "system" | "user" | "assistant"
  content: string
  /** Vision support: image_url parts carry data URLs (base64). */
  images?: string[]
}

export interface AiJsonOptions {
  messages: AiChatMessage[]
  /** Hint injected into the system prompt to enforce JSON output. */
  schemaHint: string
  temperature?: number
  maxTokens?: number
}

/** Metadata about which engine produced a result. */
export interface AiEngineInfo {
  source: "ai" | "demo"
  model?: string
  /** Present when the request fell back to demo logic. */
  fallbackReason?: string
}
