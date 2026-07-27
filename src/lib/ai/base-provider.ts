import { z } from "zod";
import {
  captionResultSchema,
  contentAnalysisSchema,
  contentScoreSchema,
  experimentProposalSchema,
  insightSchema,
  type AIProvider,
  type AiResult,
  type AiUsageMeta,
  type AnalyzeContentInput,
  type AnalyzePerformanceInput,
  type CaptionResult,
  type ContentAnalysis,
  type ContentScore,
  type ExperimentProposal,
  type GenerateCaptionInput,
  type Insight,
  type ModelTier,
  type ScoreContentInput,
} from "./types";
import {
  EXPERIMENT_TASK,
  INSIGHTS_TASK,
  SUMMARY_TASK,
  SYSTEM_ANALYST,
  analyzeContentPrompt,
  captionPrompt,
  performancePrompt,
  scoreContentPrompt,
} from "./prompts";

export interface CompletionRequest {
  system: string;
  prompt: string;
  tier: ModelTier;
  maxTokens?: number;
  images?: { mediaType: string; base64: string }[];
}

export interface CompletionResponse {
  text: string;
  usage: AiUsageMeta;
}

/** Extract the first JSON object from a model response (handles fences). */
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Model response contained no JSON object");
  return JSON.parse(candidate.slice(start, end + 1));
}

/**
 * Template-method base: vendor subclasses implement complete() and
 * embedTexts(); every high-level AIProvider method is implemented once here
 * with zod validation of model output.
 */
export abstract class BaseAIProvider implements AIProvider {
  abstract readonly name: string;
  protected abstract complete(req: CompletionRequest): Promise<CompletionResponse>;
  protected abstract embedTexts(texts: string[]): Promise<{ vectors: number[][]; usage: AiUsageMeta }>;

  private async structured<T>(
    schema: z.ZodType<T, z.ZodTypeDef, unknown>,
    req: CompletionRequest,
  ): Promise<AiResult<T>> {
    const res = await this.complete(req);
    const data = schema.parse(extractJson(res.text));
    return { data, usage: res.usage };
  }

  analyzeContent(
    input: AnalyzeContentInput,
    tier: ModelTier = "standard",
  ): Promise<AiResult<ContentAnalysis>> {
    return this.structured(contentAnalysisSchema, {
      system: SYSTEM_ANALYST,
      prompt: analyzeContentPrompt(input),
      tier,
      images: input.frames,
    });
  }

  scoreContent(
    input: ScoreContentInput,
    tier: ModelTier = "standard",
  ): Promise<AiResult<ContentScore>> {
    return this.structured(contentScoreSchema, {
      system: SYSTEM_ANALYST,
      prompt: scoreContentPrompt(input),
      tier,
    });
  }

  generateCaption(
    input: GenerateCaptionInput,
    tier: ModelTier = "standard",
  ): Promise<AiResult<CaptionResult>> {
    return this.structured(captionResultSchema, {
      system: SYSTEM_ANALYST,
      prompt: captionPrompt(input),
      tier,
    });
  }

  async generateHashtags(
    input: GenerateCaptionInput,
    tier: ModelTier = "light",
  ): Promise<AiResult<string[]>> {
    const res = await this.generateCaption(input, tier);
    return { data: res.data.hashtags, usage: res.usage };
  }

  async analyzePerformance(input: AnalyzePerformanceInput): Promise<AiResult<Insight[]>> {
    return this.insightsFrom(input);
  }

  async generateInsights(input: AnalyzePerformanceInput): Promise<AiResult<Insight[]>> {
    return this.insightsFrom(input);
  }

  private async insightsFrom(input: AnalyzePerformanceInput): Promise<AiResult<Insight[]>> {
    const wrapper = z.object({ insights: z.array(insightSchema) });
    const res = await this.structured(wrapper, {
      system: SYSTEM_ANALYST,
      prompt: performancePrompt(input, INSIGHTS_TASK),
      tier: "deep",
    });
    return { data: res.data.insights, usage: res.usage };
  }

  generateExperiment(input: AnalyzePerformanceInput): Promise<AiResult<ExperimentProposal>> {
    return this.structured(experimentProposalSchema, {
      system: SYSTEM_ANALYST,
      prompt: performancePrompt(input, EXPERIMENT_TASK),
      tier: "deep",
    });
  }

  async summarizeAnalytics(input: AnalyzePerformanceInput): Promise<AiResult<string>> {
    const wrapper = z.object({ summary: z.string() });
    const res = await this.structured(wrapper, {
      system: SYSTEM_ANALYST,
      prompt: performancePrompt(input, SUMMARY_TASK),
      tier: "standard",
    });
    return { data: res.data.summary, usage: res.usage };
  }

  async embed(texts: string[]): Promise<AiResult<number[][]>> {
    const { vectors, usage } = await this.embedTexts(texts);
    return { data: vectors, usage };
  }
}
