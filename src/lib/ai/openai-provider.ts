import { env } from "@/lib/env";
import { BaseAIProvider, type CompletionRequest, type CompletionResponse } from "./base-provider";
import { embeddingModel, modelForTier } from "./router";
import type { AiUsageMeta } from "./types";

const BASE_URL = "https://api.openai.com/v1";

/** Official OpenAI REST API (chat completions + embeddings). */
export class OpenAIProvider extends BaseAIProvider {
  readonly name = "openai";
  private apiKey: string;

  constructor() {
    super();
    const key = env().OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY is not configured");
    this.apiKey = key;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`OpenAI API ${res.status}: ${text.slice(0, 500)}`);
    }
    return (await res.json()) as T;
  }

  protected async complete(req: CompletionRequest): Promise<CompletionResponse> {
    const model = modelForTier(req.tier);
    const userContent: unknown[] = [
      ...(req.images ?? []).slice(0, 6).map((img) => ({
        type: "image_url",
        image_url: { url: `data:${img.mediaType};base64,${img.base64}` },
      })),
      { type: "text", text: req.prompt },
    ];

    const res = await this.post<{
      choices: { message: { content: string } }[];
      usage: { prompt_tokens: number; completion_tokens: number };
    }>("/chat/completions", {
      model,
      max_tokens: req.maxTokens ?? 2048,
      messages: [
        { role: "system", content: req.system },
        { role: "user", content: userContent },
      ],
    });

    const usage: AiUsageMeta = {
      provider: this.name,
      model,
      inputTokens: res.usage?.prompt_tokens ?? 0,
      outputTokens: res.usage?.completion_tokens ?? 0,
    };
    return { text: res.choices[0]?.message?.content ?? "", usage };
  }

  protected async embedTexts(
    texts: string[],
  ): Promise<{ vectors: number[][]; usage: AiUsageMeta }> {
    const model = embeddingModel();
    const res = await this.post<{
      data: { embedding: number[] }[];
      usage: { prompt_tokens: number };
    }>("/embeddings", { model, input: texts });
    return {
      vectors: res.data.map((d) => d.embedding),
      usage: {
        provider: this.name,
        model,
        inputTokens: res.usage?.prompt_tokens ?? 0,
        outputTokens: 0,
      },
    };
  }
}
