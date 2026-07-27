# 6. AI Architecture

## Provider abstraction

```ts
interface AIProvider {
  analyzeContent(input): Promise<ContentAnalysis>       // structured JSON, zod-validated
  scoreContent(input): Promise<ContentScore>            // 0-100 + breakdown + reasons + confidence
  generateCaption(input): Promise<CaptionResult>        // caption + CTA, brand-voice aware
  generateHashtags(input): Promise<string[]>
  analyzePerformance(input): Promise<PerformanceAnalysis> // interprets PRE-COMPUTED aggregates
  generateInsights(input): Promise<Insight[]>
  generateExperiment(input): Promise<ExperimentProposal>
  summarizeAnalytics(input): Promise<string>
  chat(messages, tools): Promise<ChatTurn>               // assistant with tool calling
  embed(texts): Promise<number[][]>                      // for pgvector
}
```

Implementations: `AnthropicProvider` (primary), `OpenAIProvider`, `GeminiProvider` — each against the official SDK/REST API. Provider choice is per-user/admin config (`AI_PROVIDER` default), resolved by a factory. Nothing outside `src/lib/ai/` imports a vendor SDK.

## Model routing

Centralized in `src/lib/ai/router.ts` — no model names hardcoded elsewhere:

| Task class | Examples | Tier |
|---|---|---|
| `light` | classification, hashtags, dedup hints | cheapest model (e.g. Haiku-class) |
| `standard` | content analysis, scoring, captions | mid model (Sonnet-class) |
| `deep` | strategy reports, performance interpretation, experiment design, assistant | strongest model configured |
| `embedding` | similarity vectors | embedding model (OpenAI/Voyage) |

Env: `AI_MODEL_LIGHT`, `AI_MODEL_STANDARD`, `AI_MODEL_DEEP`, `AI_EMBEDDING_MODEL`.

## Claude integration

Official `@anthropic-ai/sdk`. Claude does **not** receive raw video. The media-processing worker produces derived signals first:

```
Video → FFmpeg keyframes → thumbnail + frames (images)
      → FFmpeg audio → transcription (provider STT) → transcript
      → OCR on frames → on-screen text
      → caption + metadata (duration, dimensions, hashtags)
→ Claude: multimodal message (frames as images + structured text context)
→ zod-validated JSON: content_type, format, hook_type, hook_strength, emotional_tone,
  pace, visual_style, estimated_audience, topics, cta_present, product_focus,
  trend_score, originality_score, reusability_score
```

Analysis is cached in `ai_content_analysis`; identical media (same contentHash) is never re-analyzed unless the user forces it or prompt/model version changes.

## Scoring (explainable, hybrid)

`score = w1·aiContentScore + w2·audienceFit + w3·historicalSimilarity + w4·trend + w5·freshness + w6·diversityAdjustment + w7·pipelinePerformancePrior`

- `historicalSimilarity`: pgvector cosine against the destination's top-performing posts.
- `audienceFit`: match against the destination's Content Intelligence Profile.
- `diversityAdjustment`: penalty when recent posts share format/source/hook (configurable rules).
- Output always includes `breakdown`, `reasons[]` ("resembles 7 of your top posts…"), `confidence` (LOW/MEDIUM/HIGH by sample size), and is presented as a **prediction, never a guarantee**.
- Start: rules + statistics + AI reasoning. Later: optional learned ranking model once ≥ threshold labeled outcomes exist.

## Performance learning loop

1. `performance-sync` stores snapshots → `post_performance`.
2. `ai-insights` worker computes **statistical aggregates in SQL first** (by duration bucket, hook type, posting hour/day, content type, source): means, medians, lift vs account average, sample sizes.
3. Only these aggregates go to Claude, which writes human-readable insights **referencing the provided numbers only**. Insights below minimum sample size (default n≥20 posts, n≥5 per bucket) are marked LOW confidence or suppressed.
4. Insights update the destination's `content_intelligence_profiles`, which feeds scoring. Data-backed findings are labeled distinctly from AI recommendations in the UI.
5. Never fabricate: if there is no performance data, the UI says so and shows onboarding guidance instead of insights.

## AI Assistant — tool calling

`POST /api/ai/chat` runs a server-side tool loop. The model gets **only** these tools, each implemented as a typed function that (a) takes the *server-resolved* `userId` (never from the model), (b) validates pipeline ownership, (c) returns bounded aggregates:

`getPipelineStats, getTopPosts, getContentLibrary, getPerformanceData, getUpcomingSchedule, getSourcePerformance, getExperimentResults, getAudienceInsights`

Hard rules: no LLM-generated SQL, no DB credentials in context, no secrets/tokens ever serialized into prompts, row limits + column allow-lists per tool, per-user rate limit + token budget per conversation.

## Cost control & audit

- Every provider call records `ai_usage` (provider, model, tokens in/out, estimated cost, user, pipeline, request type). Plan quotas block further calls when exhausted (clear UI error, never silent).
- Response caching: analysis keyed by (contentHash, promptVersion, model); insights regenerated only when new performance data arrived.
- Every AI recommendation → `ai_audit_logs` with the user's action (approved/rejected/edited) and eventual outcome — the trust & debugging trail.

## Autopilot

`OFF` — AI computes nothing user-facing beyond scores. `ASSISTED` — AI proposes (approval center) and the user approves. `AUTO` — ranking, selection, captioning and scheduling proceed automatically; sensitive actions (first post to a new destination, experiment start, allocation changes) still require approval per configuration. A single switch instantly disables autopilot; in-flight non-approved actions are cancelled.
