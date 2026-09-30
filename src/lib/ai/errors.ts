// ============================================================
// SmartFood AI — AI service error types (server-side)
// Errors are converted to friendly UI messages by API routes;
// raw keys / stack traces are never sent to the client.
// ============================================================

export class AiConfigError extends Error {
  constructor() {
    super("AI service is not configured. Add AI_API_KEY (and AI_BASE_URL / AI_MODEL) to .env.local and restart the dev server.")
    this.name = "AiConfigError"
  }
}

export class AiRequestError extends Error {
  public readonly status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = "AiRequestError"
    this.status = status
  }
}

export class AiParseError extends Error {
  constructor(message = "AI returned a response that could not be parsed as JSON.") {
    super(message)
    this.name = "AiParseError"
  }
}
