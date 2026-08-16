import { NextResponse } from "next/server";
import { safeEqual } from "@/lib/crypto";
import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { runSyncJob } from "@/jobs/syncMetrics";

const log = createLogger("api:cron");

// The run walks every approved application; never let a platform build cache it.
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * POST /api/cron/sync
 *
 * HTTP entry point for the hourly sync, for deployments without an always-on
 * worker (Vercel Cron, GitHub Actions, an external scheduler). Authenticated by
 * a shared secret in `Authorization: Bearer <CRON_SECRET>`, compared in constant
 * time. Vercel Cron sends exactly this header when CRON_SECRET is set.
 */
export async function POST(req: Request) {
  if (!env.CRON_SECRET) {
    return NextResponse.json(
      {
        error: {
          message:
            "CRON_SECRET is not configured — refusing to run an unauthenticated payout job",
        },
      },
      { status: 503 }
    );
  }

  const header = req.headers.get("authorization") ?? "";
  const provided = header.replace(/^Bearer\s+/i, "");

  if (!provided || !safeEqual(provided, env.CRON_SECRET)) {
    log.warn("rejected unauthenticated cron invocation");
    return NextResponse.json(
      { error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  const report = await runSyncJob();

  // Per-application outcomes stay in the logs; the response is a summary.
  const { outcomes, ...summary } = report;
  return NextResponse.json({ data: summary });
}

/** Vercel Cron issues GETs on some plans; accept both. */
export const GET = POST;
