import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { parseBody, requireSession, withErrorHandling, jsonError } from "@/lib/api";

export const GET = withErrorHandling(async () => {
  const session = await requireSession();
  const sources = await db.source.findMany({
    where: { userId: session.userId, status: { not: "ARCHIVED" } },
    orderBy: { createdAt: "desc" },
    include: {
      pipelineSources: { select: { pipeline: { select: { id: true, name: true } } } },
      _count: { select: { apifyRuns: true } },
    },
  });
  return NextResponse.json(
    sources.map((s) => ({
      id: s.id,
      name: s.name,
      url: s.url,
      platform: s.platform,
      status: s.status,
      monitoringFrequencyMins: s.monitoringFrequencyMins,
      lastScanAt: s.lastScanAt,
      videosFound: s.videosFound,
      videosImported: s.videosImported,
      authorizationConfirmedAt: s.authorizationConfirmedAt,
      pipelines: s.pipelineSources.map((ps) => ps.pipeline),
      totalRuns: s._count.apifyRuns,
    })),
  );
});

const createSchema = z.object({
  name: z.string().min(1).max(120),
  url: z.string().url(),
  platform: z.string().default("instagram"),
  monitoringFrequencyMins: z.number().int().min(60).max(7 * 24 * 60).default(1440),
  // Mandatory rights attestation (AUP): the user confirms they own or have
  // explicit permission to reuse this source's content.
  authorizationConfirmed: z.literal(true, {
    errorMap: () => ({
      message:
        "You must confirm you own or have explicit permission to reuse this source's content",
    }),
  }),
});

export const POST = withErrorHandling(async (req: Request) => {
  const session = await requireSession();
  const body = await parseBody(req, createSchema);

  const count = await db.source.count({
    where: { userId: session.userId, status: { not: "ARCHIVED" } },
  });
  if (count >= 50) return jsonError(429, "limit_reached", "Source limit reached for your plan");

  const source = await db.source.create({
    data: {
      userId: session.userId,
      name: body.name,
      url: body.url,
      platform: body.platform,
      monitoringFrequencyMins: body.monitoringFrequencyMins,
      authorizationConfirmedAt: new Date(),
    },
  });
  return NextResponse.json(source, { status: 201 });
});
