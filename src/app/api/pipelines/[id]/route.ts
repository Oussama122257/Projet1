import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { parseBody, requireSession, withErrorHandling, ApiError } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

async function ownedPipeline(id: string, userId: string) {
  const pipeline = await db.pipeline.findUnique({ where: { id } });
  if (!pipeline || pipeline.userId !== userId) {
    throw new ApiError(404, "not_found", "Pipeline not found");
  }
  return pipeline;
}

export const GET = withErrorHandling(async (_req: Request, ctx: Ctx) => {
  const session = await requireSession();
  const { id } = await ctx.params;
  await ownedPipeline(id, session.userId);
  const pipeline = await db.pipeline.findUnique({
    where: { id },
    include: {
      pipelineSources: { include: { source: true } },
      destination: { include: { connection: { select: { id: true, status: true } } } },
      schedule: { include: { slots: true } },
      brandProfile: true,
      _count: { select: { pipelineMedia: true, scheduledPosts: true, experiments: true } },
    },
  });
  return NextResponse.json(pipeline);
});

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  status: z.enum(["ACTIVE", "PAUSED", "DRAFT"]).optional(),
  goal: z.enum(["REACH", "ENGAGEMENT", "FOLLOWERS", "TRAFFIC", "CONVERSIONS"]).optional(),
  timezone: z.string().optional(),
  aiEnabled: z.boolean().optional(),
  aiScoring: z.boolean().optional(),
  aiCaptionGeneration: z.boolean().optional(),
  aiHashtagGeneration: z.boolean().optional(),
  aiScheduling: z.boolean().optional(),
  aiRecommendations: z.boolean().optional(),
  autopilotMode: z.enum(["OFF", "ASSISTED", "AUTO"]).optional(),
  abTestingEnabled: z.boolean().optional(),
  diversityRules: z
    .object({
      maxConsecutiveSameSource: z.number().int().min(1).max(10),
      maxConsecutiveSameType: z.number().int().min(1).max(10),
      maxConsecutiveSameHook: z.number().int().min(1).max(10),
    })
    .optional(),
});

export const PATCH = withErrorHandling(async (req: Request, ctx: Ctx) => {
  const session = await requireSession();
  const { id } = await ctx.params;
  await ownedPipeline(id, session.userId);
  const body = await parseBody(req, patchSchema);
  const updated = await db.pipeline.update({ where: { id }, data: body });
  return NextResponse.json(updated);
});

export const DELETE = withErrorHandling(async (_req: Request, ctx: Ctx) => {
  const session = await requireSession();
  const { id } = await ctx.params;
  await ownedPipeline(id, session.userId);
  await db.pipeline.update({ where: { id }, data: { status: "ARCHIVED" } });
  return NextResponse.json({ ok: true });
});
