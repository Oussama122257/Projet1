import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, withErrorHandling } from "@/lib/api";
import type { Prisma } from "@prisma/client";

export const GET = withErrorHandling(async (req: Request) => {
  const session = await requireSession();
  const url = new URL(req.url);
  const sourceId = url.searchParams.get("source") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;
  const sort = url.searchParams.get("sort") ?? "newest";
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const take = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);

  const orderBy: Prisma.MediaOrderByWithRelationInput =
    sort === "aiScore" ? { aiScore: { sort: "desc", nulls: "last" } } : sort === "oldest" ? { createdAt: "asc" } : { createdAt: "desc" };

  const items = await db.media.findMany({
    where: {
      userId: session.userId,
      status: { not: "ARCHIVED" },
      ...(sourceId ? { sourceId } : {}),
      ...(status ? { status: status as never } : {}),
    },
    orderBy,
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      source: { select: { id: true, name: true } },
      analysis: {
        select: { contentType: true, hookType: true, hookStrength: true, confidence: true },
      },
      pipelineMedia: {
        select: { pipelineId: true, status: true, aiScore: true },
      },
    },
  });

  const nextCursor = items.length > take ? items[take].id : null;
  return NextResponse.json({ items: items.slice(0, take), nextCursor });
});
