import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { enqueue } from "@/lib/queue/queues";
import { withErrorHandling, jsonError } from "@/lib/api";

/**
 * Apify webhook receiver for ACTOR.RUN.* terminal events — short-circuits
 * polling. Configure the webhook in Apify with ?secret=<APIFY_WEBHOOK_SECRET>.
 * Idempotent: the monitor job re-checks run state before acting.
 */
export const POST = withErrorHandling(async (req: Request) => {
  const secret = env().APIFY_WEBHOOK_SECRET;
  const provided = new URL(req.url).searchParams.get("secret");
  if (!secret || provided !== secret) {
    return jsonError(401, "unauthorized", "Invalid webhook secret");
  }

  const payload = (await req.json().catch(() => null)) as {
    eventType?: string;
    resource?: { id?: string };
  } | null;
  const apifyRunId = payload?.resource?.id;
  if (!apifyRunId) return NextResponse.json({ ok: true });

  const runRecord = await db.apifyRun.findUnique({
    where: { apifyRunId },
    include: { source: { select: { userId: true } } },
  });
  if (runRecord && ["PENDING", "RUNNING"].includes(runRecord.status)) {
    await enqueue(
      "apify_run",
      "monitor",
      { runRecordId: runRecord.id, pollAttempt: 0 },
      { userId: runRecord.source.userId },
    );
  }
  return NextResponse.json({ ok: true });
});
