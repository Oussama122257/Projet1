import { z } from "zod";

export type ModelTier = "light" | "standard" | "deep";
export type Confidence = "LOW" | "MEDIUM" | "HIGH";

/** Structured content analysis — zod-validated, stored as JSON. */
export const contentAnalysisSchema = z.object({
  content_type: z.string(),
  format: z.string(),
  hook_type: z.string(),
  hook_strength: z.number().min(0).max(10),
  emotional_tone: z.string(),
  pace: z.string(),
  visual_style: z.string(),
  estimated_audience: z.array(z.string()),
  topics: z.array(z.string()),
  cta_present: z.boolean(),
  product_focus: z.boolean(),
  trend_score: z.number().min(0).max(10),
  originality_score: z.number().min(0).max(10),
  reusability_score: z.number().min(0).max(10),
});
export type ContentAnalysis = z.infer<typeof contentAnalysisSchema>;

export const contentScoreSchema = z.object({
  total: z.number().min(0).max(100),
  breakdown: z.object({
    hook: z.number().min(0).max(100),
    visual_quality: z.number().min(0).max(100),
    engagement_potential: z.number().min(0).max(100),
    trend_relevance: z.number().min(0).max(100),
    audience_fit: z.number().min(0).max(100),
    originality: z.number().min(0).max(100),
    predicted_performance: z.number().min(0).max(100),
  }),
  reasons: z.array(z.string()),
  confidence: z.enum(["LOW", "MEDIUM", "HIGH"]),
});
export type ContentScore = z.infer<typeof contentScoreSchema>;

export const captionResultSchema = z.object({
  caption: z.string(),
  cta: z.string().optional().default(""),
  hashtags: z.array(z.string()),
});
export type CaptionResult = z.infer<typeof captionResultSchema>;

export const insightSchema = z.object({
  type: z.enum([
    "CONTENT_PATTERN",
    "POSTING_TIME",
    "SOURCE_PERFORMANCE",
    "HOOK_PATTERN",
    "CAPTION_PATTERN",
    "AUDIENCE_PATTERN",
    "RECOMMENDATION",
  ]),
  title: z.string(),
  summary: z.string(),
  confidence: z.enum(["LOW", "MEDIUM", "HIGH"]),
});
export type Insight = z.infer<typeof insightSchema>;

export const experimentProposalSchema = z.object({
  name: z.string(),
  hypothesis: z.string(),
  variable: z.enum([
    "CAPTION",
    "HOOK",
    "POSTING_TIME",
    "HASHTAGS",
    "THUMBNAIL",
    "FORMAT",
    "LENGTH",
    "CTA",
  ]),
  primary_metric: z.string(),
  duration_days: z.number(),
  success_criteria: z.string(),
  variants: z.array(z.object({ name: z.string(), configuration: z.record(z.unknown()) })),
});
export type ExperimentProposal = z.infer<typeof experimentProposalSchema>;

export interface AnalyzeContentInput {
  caption: string | null;
  hashtags: string[];
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  platform: string;
  transcript?: string | null;
  ocrText?: string | null;
  /** base64-encoded JPEG keyframes (small) — optional multimodal signal */
  frames?: { mediaType: "image/jpeg" | "image/png"; base64: string }[];
}

export interface ScoreContentInput {
  analysis: ContentAnalysis;
  /** Pre-computed stats about the destination's historical winners (may be empty). */
  intelligenceProfile: Record<string, unknown> | null;
  historicalSampleSize: number;
  pipelineGoal: string;
}

export interface GenerateCaptionInput {
  analysis: ContentAnalysis | null;
  originalCaption: string | null;
  brandVoice: {
    brandName?: string | null;
    targetAudience?: string | null;
    tone?: string | null;
    vocabulary?: string | null;
    wordsToAvoid?: string[];
    ctaStyle?: string | null;
    emojiUsage?: string;
    language?: string;
    dialect?: string | null;
  } | null;
  style: string;
}

export interface AnalyzePerformanceInput {
  /** Statistical aggregates computed by SQL — the model interprets, never invents. */
  aggregates: Record<string, unknown>;
  sampleSize: number;
  dateRange: { start: string; end: string };
  goal: string;
}

export interface AiUsageMeta {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export interface AiResult<T> {
  data: T;
  usage: AiUsageMeta;
}

export interface ChatToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * The provider abstraction. Nothing outside src/lib/ai imports a vendor SDK.
 * All methods return validated, structured data plus token usage.
 */
export interface AIProvider {
  readonly name: string;
  analyzeContent(input: AnalyzeContentInput, tier?: ModelTier): Promise<AiResult<ContentAnalysis>>;
  scoreContent(input: ScoreContentInput, tier?: ModelTier): Promise<AiResult<ContentScore>>;
  generateCaption(input: GenerateCaptionInput, tier?: ModelTier): Promise<AiResult<CaptionResult>>;
  generateHashtags(input: GenerateCaptionInput, tier?: ModelTier): Promise<AiResult<string[]>>;
  analyzePerformance(input: AnalyzePerformanceInput): Promise<AiResult<Insight[]>>;
  generateInsights(input: AnalyzePerformanceInput): Promise<AiResult<Insight[]>>;
  generateExperiment(input: AnalyzePerformanceInput): Promise<AiResult<ExperimentProposal>>;
  summarizeAnalytics(input: AnalyzePerformanceInput): Promise<AiResult<string>>;
  embed(texts: string[]): Promise<AiResult<number[][]>>;
}
