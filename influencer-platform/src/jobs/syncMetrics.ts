import {
  prisma,
  ApplicationStatus,
  CampaignStatus,
  PayoutStatus,
} from "@/lib/db";
import { createLogger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { detectFraud } from "@/services/fraudDetection";
import {
  calculateCappedEarnings,
  canReceivePayouts,
  isPayoutsConfigured,
  outstandingBalance,
  payInfluencer,
} from "@/services/paymentService";
import {
  fetchMetricsForApplication,
  mergeMetrics,
} from "@/services/trackingService";

const log = createLogger("job:syncMetrics");

/**
 * Hourly metric sync and payout run.
 *
 * For every approved application on an active campaign:
 *   1. pull fresh platform metrics
 *   2. append a ContentMetricSnapshot (never overwrite — the series is evidence)
 *   3. recalculate earnings, capped by remaining campaign budget
 *   4. run fraud detection; a flag holds the payout and stops here
 *   5. if the balance clears the threshold and Stripe is ready, transfer
 *
 * Each application is processed independently and failures are collected rather
 * than thrown — one creator's expired token must never stop the payout run for
 * everyone else.
 *
 * MVP runs this in-process via node-cron. At scale, replace the loop body with a
 * BullMQ job per application (`syncQueue.add('sync', { applicationId })`) so work
 * is distributed, retried with backoff, and survives a deploy mid-run. The step
 * functions below are already per-application and side-effect-scoped, so that
 * migration is a wiring change, not a rewrite.
 */

export type SyncOutcome = {
  applicationId: string;
  status:
    | "synced"
    | "paid"
    | "held"
    | "skipped"
    | "failed"
    | "below_threshold"
    | "payout_failed";
  detail?: string;
  earningsCents?: number;
  paidCents?: number;
};

export type SyncReport = {
  startedAt: Date;
  finishedAt: Date;
  durationMs: number;
  processed: number;
  snapshotsWritten: number;
  flagsRaised: number;
  payoutsAttempted: number;
  payoutsSucceeded: number;
  centsPaid: number;
  failures: number;
  outcomes: SyncOutcome[];
};

/** Process one application end to end. */
export async function syncApplication(applicationId: string): Promise<SyncOutcome> {
  const app = await prisma.influencerApplication.findUnique({
    where: { id: applicationId },
    include: { campaign: true, influencer: true },
  });

  if (!app) {
    return { applicationId, status: "skipped", detail: "not found" };
  }
  if (app.status !== ApplicationStatus.APPROVED) {
    return { applicationId, status: "skipped", detail: "not approved" };
  }
  if (!app.contentId || !app.platform) {
    return { applicationId, status: "skipped", detail: "no content submitted" };
  }

  // --- 1. fetch -----------------------------------------------------------
  const result = await fetchMetricsForApplication(applicationId);
  if (!result.ok) {
    return { applicationId, status: "failed", detail: result.error };
  }
  const fresh = result.metrics;

  // --- 2. snapshot --------------------------------------------------------
  const previousSnapshot = await prisma.contentMetricSnapshot.findFirst({
    where: { applicationId },
    orderBy: { capturedAt: "desc" },
  });

  // Clicks are attributed by our own redirect layer where the platform doesn't
  // report them; take whichever source knows more.
  const attributedClicks = Math.max(app.clicks, fresh.clicks);

  const merged = mergeMetrics(
    {
      views: app.views,
      likes: app.likes,
      comments: app.comments,
      shares: app.shares,
      impressions: app.impressions,
    },
    fresh,
    attributedClicks
  );

  // --- 3. earnings --------------------------------------------------------
  // Everything the *other* participants have accrued sets this application's
  // ceiling, so a campaign can never pay out more than its budget.
  const siblings = await prisma.influencerApplication.aggregate({
    where: {
      campaignId: app.campaignId,
      id: { not: app.id },
      status: ApplicationStatus.APPROVED,
    },
    _sum: { earningsCents: true },
  });
  const otherEarned = siblings._sum.earningsCents ?? 0;

  const earnings = calculateCappedEarnings(
    { views: merged.views, clicks: merged.clicks },
    app.campaign,
    otherEarned
  );

  const snapshot = await prisma.contentMetricSnapshot.create({
    data: {
      applicationId,
      views: merged.views,
      likes: merged.likes,
      comments: merged.comments,
      shares: merged.shares,
      impressions: merged.impressions,
      reach: merged.reach,
      clicks: merged.clicks,
      viewsDelta: merged.views - (previousSnapshot?.views ?? 0),
      clicksDelta: merged.clicks - (previousSnapshot?.clicks ?? 0),
      geoDistribution: merged.geoDistribution ?? undefined,
      earningsCents: earnings.cappedCents,
    },
  });

  await prisma.influencerApplication.update({
    where: { id: applicationId },
    data: {
      views: merged.views,
      likes: merged.likes,
      comments: merged.comments,
      shares: merged.shares,
      impressions: merged.impressions,
      clicks: merged.clicks,
      earningsCents: earnings.cappedCents,
      lastSyncedAt: new Date(),
    },
  });

  // Campaign spend tracks the sum of what participants have accrued.
  const campaignTotal = await prisma.influencerApplication.aggregate({
    where: { campaignId: app.campaignId, status: ApplicationStatus.APPROVED },
    _sum: { earningsCents: true },
  });
  await prisma.campaign.update({
    where: { id: app.campaignId },
    data: { spentCents: campaignTotal._sum.earningsCents ?? 0 },
  });

  if (earnings.wasCapped) {
    log.warn("earnings capped by campaign budget", {
      applicationId,
      campaignId: app.campaignId,
      grossCents: earnings.totalCents,
      cappedCents: earnings.cappedCents,
    });
  }

  // --- 4. fraud -----------------------------------------------------------
  const fraud = await detectFraud(applicationId);
  if (fraud.blocking) {
    return {
      applicationId,
      status: "held",
      detail:
        fraud.created.map((c) => c.reason).join(", ") ||
        "existing unresolved flag",
      earningsCents: earnings.cappedCents,
    };
  }

  // --- 5. payout ----------------------------------------------------------
  const balance = outstandingBalance({
    earningsCents: earnings.cappedCents,
    paidOutCents: app.paidOutCents,
  });

  if (balance < app.campaign.minPayoutThresholdCents) {
    await prisma.influencerApplication.update({
      where: { id: applicationId },
      data: { payoutStatus: PayoutStatus.NOT_ELIGIBLE },
    });
    return {
      applicationId,
      status: "below_threshold",
      earningsCents: earnings.cappedCents,
      detail: `balance ${balance} < threshold ${app.campaign.minPayoutThresholdCents}`,
    };
  }

  if (!canReceivePayouts(app.influencer) || !isPayoutsConfigured()) {
    await prisma.influencerApplication.update({
      where: { id: applicationId },
      data: { payoutStatus: PayoutStatus.PENDING },
    });
    return {
      applicationId,
      status: "synced",
      earningsCents: earnings.cappedCents,
      detail: isPayoutsConfigured()
        ? "influencer Stripe account not verified"
        : "Stripe not configured",
    };
  }

  await prisma.influencerApplication.update({
    where: { id: applicationId },
    data: { payoutStatus: PayoutStatus.PROCESSING },
  });

  const payout = await payInfluencer(
    { ...app, influencer: app.influencer },
    balance,
    { reason: "threshold_met" }
  );

  if (!payout.ok) {
    return {
      applicationId,
      status: "payout_failed",
      detail: payout.reason,
      earningsCents: earnings.cappedCents,
    };
  }

  await recordAudit({
    action: "sync.payout_triggered",
    entityType: "InfluencerApplication",
    entityId: applicationId,
    metadata: {
      snapshotId: snapshot.id,
      amountCents: balance,
      payoutId: payout.payoutId,
    },
  });

  return {
    applicationId,
    status: "paid",
    earningsCents: earnings.cappedCents,
    paidCents: balance,
  };
}

/** Full run across every eligible application. */
export async function runSyncJob(): Promise<SyncReport> {
  const startedAt = new Date();
  log.info("sync run started");

  const applications = await prisma.influencerApplication.findMany({
    where: {
      status: ApplicationStatus.APPROVED,
      contentId: { not: null },
      campaign: { status: { in: [CampaignStatus.ACTIVE, CampaignStatus.PAUSED] } },
    },
    select: { id: true },
    orderBy: { updatedAt: "asc" },
  });

  const outcomes: SyncOutcome[] = [];

  for (const { id } of applications) {
    try {
      outcomes.push(await syncApplication(id));
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      log.error("application sync threw", { applicationId: id, detail });
      outcomes.push({ applicationId: id, status: "failed", detail });
    }
  }

  const finishedAt = new Date();
  const report: SyncReport = {
    startedAt,
    finishedAt,
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    processed: outcomes.length,
    snapshotsWritten: outcomes.filter((o) =>
      ["synced", "paid", "held", "below_threshold", "payout_failed"].includes(
        o.status
      )
    ).length,
    flagsRaised: outcomes.filter((o) => o.status === "held").length,
    payoutsAttempted: outcomes.filter((o) =>
      ["paid", "payout_failed"].includes(o.status)
    ).length,
    payoutsSucceeded: outcomes.filter((o) => o.status === "paid").length,
    centsPaid: outcomes.reduce((sum, o) => sum + (o.paidCents ?? 0), 0),
    failures: outcomes.filter((o) =>
      ["failed", "payout_failed"].includes(o.status)
    ).length,
    outcomes,
  };

  log.info("sync run finished", {
    processed: report.processed,
    paid: report.payoutsSucceeded,
    centsPaid: report.centsPaid,
    held: report.flagsRaised,
    failures: report.failures,
    durationMs: report.durationMs,
  });

  await recordAudit({
    action: "sync.run_completed",
    entityType: "System",
    entityId: "sync",
    metadata: {
      processed: report.processed,
      payoutsSucceeded: report.payoutsSucceeded,
      centsPaid: report.centsPaid,
      flagsRaised: report.flagsRaised,
      failures: report.failures,
      durationMs: report.durationMs,
    },
  });

  return report;
}
