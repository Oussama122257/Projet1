import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { parseBody, requireSession, withErrorHandling, jsonError } from "@/lib/api";

export const GET = withErrorHandling(async () => {
  const session = await requireSession();
  const pipelines = await db.pipeline.findMany({
    where: { userId: session.userId, status: { not: "ARCHIVED" } },
    orderBy: { createdAt: "desc" },
    include: {
      pipelineSources: { include: { source: { select: { id: true, name: true } } } },
      destination: { select: { id: true, network: true, displayName: true } },
      schedule: { select: { postsPerDay: true, active: true } },
      _count: { select: { pipelineMedia: true, scheduledPosts: true } },
    },
  });
  return NextResponse.json(pipelines);
});

const createSchema = z.object({
  name: z.string().min(1).max(120),
  goal: z
    .enum(["REACH", "ENGAGEMENT", "FOLLOWERS", "TRAFFIC", "CONVERSIONS"])
    .default("ENGAGEMENT"),
  timezone: z.string().default("UTC"),
  sourceIds: z.array(z.string()).default([]),
});

export const POST = withErrorHandling(async (req: Request) => {
  const session = await requireSession();
  const body = await parseBody(req, createSchema);

  // Sources must belong to the user (ownership check before linking).
  if (body.sourceIds.length > 0) {
    const owned = await db.source.count({
      where: { id: { in: body.sourceIds }, userId: session.userId },
    });
    if (owned !== body.sourceIds.length) {
      return jsonError(403, "forbidden", "One or more sources do not belong to you");
    }
  }

  const pipeline = await db.pipeline.create({
    data: {
      userId: session.userId,
      name: body.name,
      goal: body.goal,
      timezone: body.timezone,
      pipelineSources: {
        create: body.sourceIds.map((sourceId) => ({ sourceId })),
      },
    },
    include: { pipelineSources: true },
  });
  return NextResponse.json(pipeline, { status: 201 });
});
