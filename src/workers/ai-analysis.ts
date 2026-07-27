import type { Job } from "bullmq";
import { db } from "@/lib/db";
import { getAIProvider, recordAiUsage, checkAiBudget, PROMPT_VERSION } from "@/lib/ai";
import { scoped } from "@/lib/logger";

const log = scoped("ai-analysis");

/**
 * "analyze" {mediaId}: run structured AI content analysis + scoring.
 * Respects user consent flags and plan budget; caches by (media, promptVersion)
 * so identical media is never re-analyzed unnecessarily.
 */
export async function processAiAnalysis(job: Job): Promise<void> {
  const { mediaId, force = false } = job.data as { mediaId: string; force?: boolean };

  const media = await db.media.findUnique({
    where: { id: mediaId },
    include: { analysis: true, user: true, pipelineMedia: { include: { pipeline: true } } },
  });
  if (!media) return;

  // Consent gate (privacy model): user controls whether content goes to AI.
  if (!media.user.allowAiAnalysis) {
    await db.media.update({
      where: { id: mediaId },
      data: { aiAnalysisStatus: "SKIPPED" },
    });
    return;
  }

  // Cache: skip when a fresh analysis exists for the current prompt version.
  if (!force && media.analysis && media.analysis.promptVersion === PROMPT_VERSION) {
    log.info({ mediaId }, "analysis cache hit — skipping");
    return;
  }

  if (!(await checkAiBudget(media.userId, media.user.plan))) {
    await db.media.update({ where: { id: mediaId }, data: { aiAnalysisStatus: "SKIPPED" } });
    await db.log.create({
      data: {
        userId: media.userId,
        level: "warn",
        scope: "ai-analysis",
        message: "AI budget exhausted — analysis skipped",
        context: { mediaId },
      },
    });
    return;
  }

  await db.media.update({ where: { id: mediaId }, data: { aiAnalysisStatus: "RUNNING" } });

  try {
    const provider = getAIProvider(media.user.preferredAiProvider);

    const analysisRes = await provider.analyzeContent({
      caption: media.caption,
      hashtags: media.hashtags,
      durationSeconds: media.duration,
      width: media.width,
      height: media.height,
      platform: media.platform,
      // Keyframes/transcript/OCR arrive in Phase 3 (media-processing worker);
      // analysis quality improves automatically once those signals exist.
    });
    await recordAiUsage({
      userId: media.userId,
      requestType: "analysis",
      usage: analysisRes.usage,
    });

    // Score per pipeline (audience fit depends on each destination's profile).
    const pipelineScores: { pipelineMediaId: string; score: number; reason: string }[] = [];
    let globalScore: number | null = null;

    for (const pm of media.pipelineMedia) {
      if (!pm.pipeline.aiEnabled || !pm.pipeline.aiScoring) continue;
      const destination = await db.pipelineDestination.findUnique({
        where: { pipelineId: pm.pipelineId },
        include: { intelligenceProfile: true },
      });
      const profile = destination?.intelligenceProfile;
      const scoreRes = await provider.scoreContent({
        analysis: analysisRes.data,
        intelligenceProfile: (profile?.profileJson as Record<string, unknown>) ?? null,
        historicalSampleSize: profile?.sampleSize ?? 0,
        pipelineGoal: pm.pipeline.goal,
      });
      await recordAiUsage({
        userId: media.userId,
        pipelineId: pm.pipelineId,
        requestType: "scoring",
        usage: scoreRes.usage,
      });
      pipelineScores.push({
        pipelineMediaId: pm.id,
        score: Math.round(scoreRes.data.total),
        reason: scoreRes.data.reasons.join(" "),
      });
      globalScore = globalScore ?? Math.round(scoreRes.data.total);
    }

    const a = analysisRes.data;
    await db.aiContentAnalysis.upsert({
      where: { mediaId },
      update: {
        provider: provider.name,
        model: analysisRes.usage.model,
        promptVersion: PROMPT_VERSION,
        contentType: a.content_type,
        hookType: a.hook_type,
        hookStrength: Math.round(a.hook_strength),
        trendScore: Math.round(a.trend_score),
        originalityScore: Math.round(a.originality_score),
        reusabilityScore: Math.round(a.reusability_score),
        analysisJson: a,
      },
      create: {
        mediaId,
        provider: provider.name,
        model: analysisRes.usage.model,
        promptVersion: PROMPT_VERSION,
        contentType: a.content_type,
        hookType: a.hook_type,
        hookStrength: Math.round(a.hook_strength),
        trendScore: Math.round(a.trend_score),
        originalityScore: Math.round(a.originality_score),
        reusabilityScore: Math.round(a.reusability_score),
        analysisJson: a,
      },
    });

    for (const ps of pipelineScores) {
      await db.pipelineMedia.update({
        where: { id: ps.pipelineMediaId },
        data: { aiScore: ps.score, reason: ps.reason },
      });
    }

    await db.media.update({
      where: { id: mediaId },
      data: { aiAnalysisStatus: "COMPLETED", aiScore: globalScore, status: "READY" },
    });
  } catch (err) {
    await db.media.update({ where: { id: mediaId }, data: { aiAnalysisStatus: "FAILED" } });
    throw err;
  }
}
