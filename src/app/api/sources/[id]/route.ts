import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { parseBody, requireSession, withErrorHandling, jsonError, ApiError } from "@/lib/api";

async function ownedSource(id: string, userId: string) {
  const source = await db.source.findUnique({ where: { id } });
  if (!source || source.userId !== userId) {
    throw new ApiError(404, "not_found", "Source not found");
  }
  return source;
}

type Ctx = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_req: Request, ctx: Ctx) => {
  const session = await requireSession();
  const { id } = await ctx.params;
  const source = await ownedSource(id, session.userId);
  const runs = await db.apifyRun.findMany({
    where: { sourceId: id },
    orderBy: { startedAt: "desc" },
    take: 10,
  });
  return NextResponse.json({ ...source, recentRuns: runs });
});

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  status: z.enum(["ACTIVE", "PAUSED"]).optional(),
  monitoringFrequencyMins: z.number().int().min(60).max(10080).optional(),
});

export const PATCH = withErrorHandling(async (req: Request, ctx: Ctx) => {
  const session = await requireSession();
  const { id } = await ctx.params;
  await ownedSource(id, session.userId);
  const body = await parseBody(req, patchSchema);
  const updated = await db.source.update({ where: { id }, data: body });
  return NextResponse.json(updated);
});

export const DELETE = withErrorHandling(async (_req: Request, ctx: Ctx) => {
  const session = await requireSession();
  const { id } = await ctx.params;
  await ownedSource(id, session.userId);
  const inUse = await db.pipelineSource.count({ where: { sourceId: id } });
  if (inUse > 0) {
    return jsonError(409, "in_use", "Detach this source from its pipelines before archiving");
  }
  await db.source.update({ where: { id }, data: { status: "ARCHIVED" } });
  return NextResponse.json({ ok: true });
});
