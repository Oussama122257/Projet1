import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, withErrorHandling, jsonError } from "@/lib/api";
import { enqueue } from "@/lib/queue/queues";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withErrorHandling(async (_req: Request, ctx: Ctx) => {
  const session = await requireSession();
  const { id } = await ctx.params;

  const source = await db.source.findUnique({ where: { id } });
  if (!source || source.userId !== session.userId) {
    return jsonError(404, "not_found", "Source not found");
  }
  if (source.status !== "ACTIVE") {
    return jsonError(409, "source_paused", "Activate the source before scanning");
  }
  if (!source.authorizationConfirmedAt) {
    return jsonError(403, "not_authorized", "Confirm content reuse rights before scanning");
  }

  const activeRun = await db.apifyRun.findFirst({
    where: { sourceId: id, status: { in: ["PENDING", "RUNNING"] } },
  });
  if (activeRun) {
    return jsonError(409, "scan_in_progress", "A scan is already running for this source");
  }

  const jobId = await enqueue("source_scan", "scan", { sourceId: id }, { userId: session.userId });
  return NextResponse.json({ jobId }, { status: 202 });
});
