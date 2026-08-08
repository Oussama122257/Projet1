import OpenAI from "openai";

/**
 * Shared OpenAI client. Every AI feature degrades gracefully when the key is
 * absent (dev environments, outages): callers check `aiAvailable()` and fall
 * back to deterministic logic so the marketplace never breaks.
 */
let client: OpenAI | null = null;

export function aiAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

export function openai(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export const AI_MODEL = process.env.OPENAI_MODEL || "gpt-4o";

/** Small helper: single-shot JSON completion with a system prompt. */
export async function jsonCompletion<T>(system: string, user: string): Promise<T> {
  const res = await openai().chat.completions.create({
    model: AI_MODEL,
    response_format: { type: "json_object" },
    temperature: 0.4,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return JSON.parse(res.choices[0]?.message?.content ?? "{}") as T;
}
