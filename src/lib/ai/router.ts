import { env } from "@/lib/env";
import type { ModelTier } from "./types";

/**
 * Centralized model routing. No model names are hardcoded anywhere else in
 * the application — tasks declare a tier, this module resolves the model.
 */
export function modelForTier(tier: ModelTier): string {
  const e = env();
  switch (tier) {
    case "light":
      return e.AI_MODEL_LIGHT;
    case "standard":
      return e.AI_MODEL_STANDARD;
    case "deep":
      return e.AI_MODEL_DEEP;
  }
}

export function embeddingModel(): string {
  return env().AI_EMBEDDING_MODEL;
}

/**
 * Rough public-price cost estimation per provider/model family, USD per
 * million tokens. Used for budgeting/quota display, not billing. Update as
 * pricing changes; unknown models fall back to a conservative default.
 */
const PRICE_TABLE: { match: RegExp; inPerM: number; outPerM: number }[] = [
  { match: /haiku/i, inPerM: 1, outPerM: 5 },
  { match: /sonnet/i, inPerM: 3, outPerM: 15 },
  { match: /opus/i, inPerM: 15, outPerM: 75 },
  { match: /gpt-4o-mini/i, inPerM: 0.15, outPerM: 0.6 },
  { match: /gpt-4/i, inPerM: 2.5, outPerM: 10 },
  { match: /gemini.*flash/i, inPerM: 0.15, outPerM: 0.6 },
  { match: /gemini/i, inPerM: 1.25, outPerM: 5 },
  { match: /embedding/i, inPerM: 0.02, outPerM: 0 },
];

export function estimateCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const row = PRICE_TABLE.find((r) => r.match.test(model)) ?? { inPerM: 5, outPerM: 15 };
  return (inputTokens / 1_000_000) * row.inPerM + (outputTokens / 1_000_000) * row.outPerM;
}
