import { env } from "@/lib/env";
import { BaseAIProvider, type CompletionRequest, type CompletionResponse } from "./base-provider";
import { modelForTier } from "./router";
import type { AiUsageMeta } from "./types";

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

/** Official Google Gemini REST API (generateContent + embedContent). */
export class GeminiProvider extends BaseAIProvider {
  readonly name = "gemini";
  private apiKey: string;

  constructor() {
    super();
    const key = env().GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is not configured");
    this.apiKey = key;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "x-goog-api-key": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Gemini API ${res.status}: ${text.slice(0, 500)}`);
    }
    return (await res.json()) as T;
  }

  protected async complete(req: CompletionRequest): Promise<CompletionResponse> {
    const model = modelForTier(req.tier);
    const parts: unknown[] = [
      ...(req.images ?? []).slice(0, 6).map((img) => ({
        inline_data: { mime_type: img.mediaType, data: img.base64 },
      })),
      { text: req.prompt },
    ];

    const res = await this.post<{
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    }>(`/models/${encodeURIComponent(model)}:generateContent`, {
      system_instruction: { parts: [{ text: req.system }] },
      contents: [{ role: "user", parts }],
      generationConfig: { maxOutputTokens: req.maxTokens ?? 2048 },
    });

    const text =
      res.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    const usage: AiUsageMeta = {
      provider: this.name,
      model,
      inputTokens: res.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: res.usageMetadata?.candidatesTokenCount ?? 0,
    };
    return { text, usage };
  }

  protected async embedTexts(
    texts: string[],
  ): Promise<{ vectors: number[][]; usage: AiUsageMeta }> {
    const model = "text-embedding-004";
    const vectors: number[][] = [];
    for (const text of texts) {
      const res = await this.post<{ embedding?: { values?: number[] } }>(
        `/models/${model}:embedContent`,
        { content: { parts: [{ text }] } },
      );
      vectors.push(res.embedding?.values ?? []);
    }
    return {
      vectors,
      usage: { provider: this.name, model, inputTokens: 0, outputTokens: 0 },
    };
  }
}
