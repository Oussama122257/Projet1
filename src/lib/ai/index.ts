import { env } from "@/lib/env";
import { AnthropicProvider } from "./anthropic-provider";
import { GeminiProvider } from "./gemini-provider";
import { OpenAIProvider } from "./openai-provider";
import type { AIProvider } from "./types";

let cached: AIProvider | null = null;
let cachedName: string | null = null;

/**
 * Provider factory. Preference order: explicit argument (per-user setting) →
 * AI_PROVIDER env. The application depends only on the AIProvider interface.
 */
export function getAIProvider(preferred?: string | null): AIProvider {
  const name = preferred ?? env().AI_PROVIDER;
  if (cached && cachedName === name) return cached;
  switch (name) {
    case "openai":
      cached = new OpenAIProvider();
      break;
    case "gemini":
      cached = new GeminiProvider();
      break;
    case "anthropic":
    default:
      cached = new AnthropicProvider();
      break;
  }
  cachedName = name;
  return cached;
}

/** Embeddings provider — Anthropic has no embedding API, so fall back to OpenAI. */
export function getEmbeddingProvider(): AIProvider {
  if (env().AI_PROVIDER !== "anthropic") return getAIProvider();
  if (!env().OPENAI_API_KEY) {
    throw new Error("Embeddings require OPENAI_API_KEY when AI_PROVIDER=anthropic");
  }
  return new OpenAIProvider();
}

export { recordAiUsage, checkAiBudget } from "./usage";
export { modelForTier, estimateCostUsd } from "./router";
export { PROMPT_VERSION } from "./prompts";
export type * from "./types";
