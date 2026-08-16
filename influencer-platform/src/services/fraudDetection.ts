import {
  prisma,
  type ContentMetricSnapshot,
  type InfluencerApplication,
  FraudReason,
  FraudSeverity,
  PayoutStatus,
} from "@/lib/db";
import { createLogger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";

const log = createLogger("fraud");

/**
 * Fraud rules.
 *
 * Thresholds live here as named constants rather than magic numbers in the
 * rule bodies — they're the knobs an operator tunes as real traffic patterns
 * emerge, and the admin UI surfaces them alongside each flag.
 */
export const RULES = {
  /** Views above this with near-zero clicks means the audience isn't real. */
  LOW_ENGAGEMENT_MIN_VIEWS: 10_000,
  LOW_ENGAGEMENT_MAX_CLICKS: 10,

  /** A single region owning more than this share of the audience. */
  GEO_CONCENTRATION_THRESHOLD: 0.7,

  /** Hour-over-hour view growth multiple that counts as a spike. */
  SPIKE_GROWTH_RATIO: 5.0, // +500%
  /** Consecutive spiking snapshots required before flagging. */
  SPIKE_SUSTAINED_SNAPSHOTS: 3,
  /** Below this view count, growth ratios are noise, not signal. */
  SPIKE_MIN_VIEWS: 1_000,

  /** Click-through rates above this are implausible for organic social. */
  CTR_IMPLAUSIBLE_MAX: 0.35,
  CTR_MIN_VIEWS: 500,
} as const;

export type GeoDistribution = Record<string, number>;

export type FraudCandidate = {
  reason: FraudReason;
  severity: FraudSeverity;
  detail: string;
  evidence: Record<string, unknown>;
};

export type FraudContext = {
  application: Pick<InfluencerApplication, "id" | "views" | "clicks">;
  /** Newest first. The head is the snapshot that just landed. */
  snapshots: ContentMetricSnapshot[];
};

// ---------------------------------------------------------------------------
// Individual rules
// ---------------------------------------------------------------------------

/** Lots of views, essentially no clicks → the traffic isn't behaving like people. */
function checkLowEngagement(ctx: FraudContext): FraudCandidate | null {
  const { views, clicks } = ctx.application;
  if (
    views > RULES.LOW_ENGAGEMENT_MIN_VIEWS &&
    clicks < RULES.LOW_ENGAGEMENT_MAX_CLICKS
  ) {
    return {
      reason: FraudReason.LOW_ENGAGEMENT_RATIO,
      severity: views > RULES.LOW_ENGAGEMENT_MIN_VIEWS * 10
        ? FraudSeverity.HIGH
        : FraudSeverity.MEDIUM,
      detail: `${views.toLocaleString()} views produced only ${clicks} clicks — far below any plausible organic rate.`,
      evidence: {
        views,
        clicks,
        clickRate: views > 0 ? clicks / views : 0,
        thresholdViews: RULES.LOW_ENGAGEMENT_MIN_VIEWS,
        thresholdClicks: RULES.LOW_ENGAGEMENT_MAX_CLICKS,
      },
    };
  }
  return null;
}

/** One region dominating the audience suggests a bought view farm. */
function checkGeoConcentration(ctx: FraudContext): FraudCandidate | null {
  const latest = ctx.snapshots[0];
  const geo = latest?.geoDistribution as GeoDistribution | null | undefined;
  if (!geo || typeof geo !== "object") return null;

  const entries = Object.entries(geo).filter(
    ([, share]) => typeof share === "number" && Number.isFinite(share)
  );
  if (entries.length === 0) return null;

  // A single-country audience is normal for a local campaign, so this rule only
  // fires when the distribution claims to be multi-region yet one slice owns it.
  if (entries.length < 2) return null;

  const [topRegion, topShare] = entries.reduce((max, cur) =>
    cur[1] > max[1] ? cur : max
  );

  if (topShare > RULES.GEO_CONCENTRATION_THRESHOLD) {
    return {
      reason: FraudReason.GEO_CONCENTRATION,
      severity:
        topShare > 0.9 ? FraudSeverity.HIGH : FraudSeverity.MEDIUM,
      detail: `${(topShare * 100).toFixed(1)}% of the audience resolves to a single region (${topRegion}), above the ${(RULES.GEO_CONCENTRATION_THRESHOLD * 100).toFixed(0)}% threshold.`,
      evidence: {
        topRegion,
        topShare,
        threshold: RULES.GEO_CONCENTRATION_THRESHOLD,
        distribution: geo,
      },
    };
  }
  return null;
}

/**
 * Sustained hour-over-hour view explosions.
 *
 * One spike is a post going viral; three consecutive multiples of +500% is a
 * purchase. We require the sustained run precisely so genuine virality isn't
 * penalised.
 */
function checkSpikeAnomaly(ctx: FraudContext): FraudCandidate | null {
  const needed = RULES.SPIKE_SUSTAINED_SNAPSHOTS;
  // Need N growth ratios, which requires N+1 snapshots.
  if (ctx.snapshots.length < needed + 1) return null;

  const window = ctx.snapshots.slice(0, needed + 1); // newest first
  const ratios: { ratio: number; at: Date; from: number; to: number }[] = [];

  for (let i = 0; i < needed; i++) {
    const newer = window[i];
    const older = window[i + 1];
    if (older.views < RULES.SPIKE_MIN_VIEWS) return null; // too small to judge
    const ratio = newer.views / Math.max(1, older.views);
    ratios.push({
      ratio,
      at: newer.capturedAt,
      from: older.views,
      to: newer.views,
    });
  }

  const allSpiking = ratios.every((r) => r.ratio > RULES.SPIKE_GROWTH_RATIO);
  if (!allSpiking) return null;

  const peak = Math.max(...ratios.map((r) => r.ratio));
  return {
    reason: FraudReason.SPIKE_ANOMALY,
    severity: peak > 20 ? FraudSeverity.CRITICAL : FraudSeverity.HIGH,
    detail: `View count grew more than ${((RULES.SPIKE_GROWTH_RATIO - 1) * 100).toFixed(0)}% per hour across ${needed} consecutive snapshots (peak ${peak.toFixed(1)}×).`,
    evidence: {
      sustainedSnapshots: needed,
      growthRatios: ratios.map((r) => ({
        capturedAt: r.at.toISOString(),
        fromViews: r.from,
        toViews: r.to,
        ratio: Number(r.ratio.toFixed(2)),
      })),
      threshold: RULES.SPIKE_GROWTH_RATIO,
    },
  };
}

/** A click-through rate no organic post achieves — usually click injection. */
function checkClickViewAnomaly(ctx: FraudContext): FraudCandidate | null {
  const { views, clicks } = ctx.application;
  if (views < RULES.CTR_MIN_VIEWS) return null;

  const ctr = clicks / views;
  if (ctr > RULES.CTR_IMPLAUSIBLE_MAX) {
    return {
      reason: FraudReason.CLICK_VIEW_ANOMALY,
      severity: ctr > 0.6 ? FraudSeverity.CRITICAL : FraudSeverity.HIGH,
      detail: `Click-through rate of ${(ctr * 100).toFixed(1)}% exceeds the ${(RULES.CTR_IMPLAUSIBLE_MAX * 100).toFixed(0)}% plausibility ceiling — clicks are outpacing views.`,
      evidence: {
        views,
        clicks,
        ctr,
        threshold: RULES.CTR_IMPLAUSIBLE_MAX,
      },
    };
  }
  return null;
}

const ALL_RULES = [
  checkLowEngagement,
  checkGeoConcentration,
  checkSpikeAnomaly,
  checkClickViewAnomaly,
];

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

/** Run every rule. Pure — no database writes, so it's trivially testable. */
export function evaluateRules(ctx: FraudContext): FraudCandidate[] {
  return ALL_RULES.map((rule) => rule(ctx)).filter(
    (c): c is FraudCandidate => c !== null
  );
}

/** Unresolved flags are what actually block a payout. */
export async function hasActiveFlag(applicationId: string): Promise<boolean> {
  const count = await prisma.fraudFlag.count({
    where: { applicationId, resolvedAt: null },
  });
  return count > 0;
}

export type DetectFraudResult = {
  flagged: boolean;
  created: FraudCandidate[];
  /** Includes pre-existing unresolved flags, not just newly created ones. */
  blocking: boolean;
};

/**
 * Evaluate an application and persist any new flags.
 *
 * A flagged application has its payout status moved to HELD_FOR_REVIEW; the
 * sync job stops there and an admin must clear the flag before money moves.
 * Re-flagging is deduplicated by (application, reason) while a flag is open, so
 * an hourly cron doesn't pile up 24 identical rows a day.
 */
export async function detectFraud(
  applicationId: string,
  opts: { snapshotLimit?: number } = {}
): Promise<DetectFraudResult> {
  const application = await prisma.influencerApplication.findUnique({
    where: { id: applicationId },
    select: { id: true, views: true, clicks: true },
  });

  if (!application) {
    return { flagged: false, created: [], blocking: false };
  }

  const snapshots = await prisma.contentMetricSnapshot.findMany({
    where: { applicationId },
    orderBy: { capturedAt: "desc" },
    take: opts.snapshotLimit ?? 12,
  });

  const candidates = evaluateRules({ application, snapshots });

  const openFlags = await prisma.fraudFlag.findMany({
    where: { applicationId, resolvedAt: null },
    select: { reason: true },
  });
  const alreadyOpen = new Set(openFlags.map((f) => f.reason));

  const fresh = candidates.filter((c) => !alreadyOpen.has(c.reason));

  for (const candidate of fresh) {
    const flag = await prisma.fraudFlag.create({
      data: {
        applicationId,
        reason: candidate.reason,
        severity: candidate.severity,
        detail: candidate.detail,
        evidence: candidate.evidence as object,
      },
    });

    await recordAudit({
      action: "fraud.flagged",
      entityType: "InfluencerApplication",
      entityId: applicationId,
      metadata: {
        flagId: flag.id,
        reason: candidate.reason,
        severity: candidate.severity,
      },
    });

    log.warn("fraud flag raised", {
      applicationId,
      reason: candidate.reason,
      severity: candidate.severity,
    });
  }

  const blocking = alreadyOpen.size > 0 || fresh.length > 0;

  if (blocking) {
    await prisma.influencerApplication.update({
      where: { id: applicationId },
      data: { payoutStatus: PayoutStatus.HELD_FOR_REVIEW },
    });
  }

  return { flagged: fresh.length > 0, created: fresh, blocking };
}

/**
 * Admin decision on a flag.
 *
 * Clearing the last open flag returns the application to the payout queue;
 * upholding leaves it held. Either way the reviewer is recorded.
 */
export async function resolveFlag(
  flagId: string,
  resolution: "CLEARED" | "UPHELD",
  adminId: string,
  note?: string
) {
  const flag = await prisma.fraudFlag.update({
    where: { id: flagId },
    data: {
      resolution,
      resolvedById: adminId,
      resolvedAt: new Date(),
      resolverNote: note,
    },
  });

  const remaining = await prisma.fraudFlag.count({
    where: { applicationId: flag.applicationId, resolvedAt: null },
  });

  if (resolution === "CLEARED" && remaining === 0) {
    // Back to PENDING — the next sync re-evaluates the threshold and pays out.
    await prisma.influencerApplication.update({
      where: { id: flag.applicationId },
      data: { payoutStatus: PayoutStatus.PENDING },
    });
  }

  await recordAudit({
    action: resolution === "CLEARED" ? "fraud.cleared" : "fraud.upheld",
    entityType: "InfluencerApplication",
    entityId: flag.applicationId,
    actorId: adminId,
    actorLabel: "admin",
    metadata: { flagId, reason: flag.reason, note, remainingOpenFlags: remaining },
  });

  return { flag, remainingOpenFlags: remaining };
}
