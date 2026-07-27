import { db } from "@/lib/db";
import { estimateCostUsd } from "./router";
import type { AiUsageMeta } from "./types";

/**
 * Record every AI call for cost control & transparency (ai_usage table).
 * Callers pass the request type ("analysis" | "scoring" | "caption" |
 * "insights" | "experiment" | "chat" | "embedding" ...).
 */
export async function recordAiUsage(params: {
  userId: string;
  pipelineId?: string | null;
  requestType: string;
  usage: AiUsageMeta;
}): Promise<void> {
  await db.aiUsage.create({
    data: {
      userId: params.userId,
      pipelineId: params.pipelineId ?? null,
      provider: params.usage.provider,
      model: params.usage.model,
      requestType: params.requestType,
      inputTokens: params.usage.inputTokens,
      outputTokens: params.usage.outputTokens,
      estimatedCost: estimateCostUsd(
        params.usage.model,
        params.usage.inputTokens,
        params.usage.outputTokens,
      ),
    },
  });
}

/** Monthly token budget per plan (input+output). */
const PLAN_TOKEN_LIMITS: Record<string, number> = {
  FREE: 200_000,
  STARTER: 2_000_000,
  PRO: 10_000_000,
  SCALE: 50_000_000,
};

export async function checkAiBudget(userId: string, plan: string): Promise<boolean> {
  const limit = PLAN_TOKEN_LIMITS[plan] ?? PLAN_TOKEN_LIMITS.FREE;
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const agg = await db.aiUsage.aggregate({
    where: { userId, createdAt: { gte: monthStart } },
    _sum: { inputTokens: true, outputTokens: true },
  });
  const used = (agg._sum.inputTokens ?? 0) + (agg._sum.outputTokens ?? 0);
  return used < limit;
}
