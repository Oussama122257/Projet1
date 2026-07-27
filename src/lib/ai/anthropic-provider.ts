import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";
import { BaseAIProvider, type CompletionRequest, type CompletionResponse } from "./base-provider";
import { modelForTier } from "./router";
import type { AiUsageMeta } from "./types";

/**
 * Primary provider — official Anthropic SDK (Messages API).
 * Multimodal: keyframes are passed as image blocks alongside structured text.
 */
export class AnthropicProvider extends BaseAIProvider {
  readonly name = "anthropic";
  private client: Anthropic;

  constructor() {
    super();
    const apiKey = env().ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");
    this.client = new Anthropic({ apiKey });
  }

  protected async complete(req: CompletionRequest): Promise<CompletionResponse> {
    const model = modelForTier(req.tier);

    const content: Anthropic.ContentBlockParam[] = [
      ...(req.images ?? []).slice(0, 6).map(
        (img): Anthropic.ImageBlockParam => ({
          type: "image",
          source: {
            type: "base64",
            media_type: img.mediaType as "image/jpeg" | "image/png",
            data: img.base64,
          },
        }),
      ),
      { type: "text", text: req.prompt },
    ];

    const res = await this.client.messages.create({
      model,
      max_tokens: req.maxTokens ?? 2048,
      system: req.system,
      messages: [{ role: "user", content }],
    });

    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const usage: AiUsageMeta = {
      provider: this.name,
      model,
      inputTokens: res.usage.input_tokens,
      outputTokens: res.usage.output_tokens,
    };
    return { text, usage };
  }

  /**
   * Anthropic does not offer a first-party embedding endpoint; deployments
   * using Anthropic as the chat provider must configure OpenAI (or another
   * vector provider) for embeddings. The factory wires that automatically.
   */
  protected async embedTexts(): Promise<{ vectors: number[][]; usage: AiUsageMeta }> {
    throw new Error(
      "Anthropic has no embedding API — configure OPENAI_API_KEY for embeddings",
    );
  }
}
